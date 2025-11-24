const PDFDocument = require('pdfkit');
const db = require('../models');

// Función auxiliar para dibujar un rectángulo con texto centrado verticalmente
// y que maneja el desplazamiento horizontal (para simplificar la tabla).
const drawCell = (doc, text, x, y, width, height, align = 'left') => {
    // Es crucial asegurarse de que x, y, width, y height sean números válidos
    // (La lógica ya verifica en la tabla que no sean NaN al calcularlos)
    doc.rect(x, y, width, height).stroke();
    
    // Ajuste de Y para centrar verticalmente (asumiendo tamaño de fuente 8-10)
    // Se usa doc.currentLineHeight() para una mejor precisión.
    const textY = y + (height / 2) - (doc.currentLineHeight() / 2); 

    doc.text(text, x, textY, {
        width: width,
        align: align,
        ellipsis: true
    });
};
// Función auxiliar para obtener el estado de aprobación
const getApprovalStatus = (average) => {
    if (average == null) return '---';
    const numAvg = Number(average);
    return numAvg >= 11 ? 'APROBADO' : 'DESAPROBADO';
};


exports.generateReportByYearAndStudent = async (req, res) => {
    const { studentEnrollmentId, yearId } = req.params;

    try {
        // 1. Año
        const year = await db.Years.findByPk(yearId);
        if (!year) {
            return res.status(404).json({ message: 'Año no encontrado' });
        }

        // 2. Matrícula del estudiante
        const enrollment = await db.StudentEnrollment.findByPk(
            studentEnrollmentId,
            {
                include: [
                    { model: db.Person, as: 'persons' },
                    { model: db.Grade, as: 'grades' },
                    { model: db.Section, as: 'sections' },
                ],
            }
        );

        if (!enrollment) {
            return res
                .status(404)
                .json({ message: 'Matrícula de estudiante no encontrada' });
        }

        const studentPerson = enrollment.persons;
        const grade = enrollment.grades;
        const section = enrollment.sections;

        // 3. Tutor del grado/sección
        const tutorTeacher = await db.TutorTeacher.findOne({
            where: {
                gradeId: enrollment.gradeId,
                sectionId: enrollment.sectionId,
            },
            include: [
                {
                    model: db.TeacherAssignment,
                    as: 'teachers',
                    include: [
                        {
                            model: db.Person,
                            as: 'persons',
                        },
                    ],
                },
            ],
        });

        const tutorName =
            tutorTeacher?.teachers?.persons
                ? `${tutorTeacher.teachers.persons.names} ${tutorTeacher.teachers.persons.lastNames}`
                : 'No asignado';

        // 4. Promedios por curso (overallcourseaverage)
        const courseAverages = await db.OverallCourseAverage.findAll({
            where: {
                yearId,
                studentId: studentEnrollmentId,
            },
            include: [
                {
                    model: db.TeacherGroup,
                    as: 'teachergroups',
                    include: [
                        { model: db.Courses, as: 'courses' },
                    ],
                },
            ],
            order: [
                [
                    db.Sequelize.literal('`teachergroups->courses`.`course`'),
                    'ASC',
                ],
            ],
        });

        // 5. Promedios por bloque (teachingblockavarage)
        const assignmentIds = courseAverages.map((ca) => ca.assignmentId);
        const blocks = await db.TeachingBlockAverage.findAll({
            where: {
                assignmentId: assignmentIds,
                studentId: studentEnrollmentId,
            },
            include: [
                {
                    model: db.TeachingBlock,
                    as: 'teachingblocks',
                },
            ],
        });

        const blockMap = {};
        blocks.forEach((b) => {
            const key = `${b.assignmentId}-${b.teachingBlockId}`;
            blockMap[key] = b;
        });

        // 6. Promedio general anual
        const annual = await db.AnnualAverage.findOne({
            where: {
                yearId,
                studentId: studentEnrollmentId,
            },
        });

        // --- Configuración y Generación del PDF ---

        // Configuración de la página HORIZONTAL (Layout: landscape)
        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
        const page_width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const startX = doc.page.margins.left;
        let y = doc.page.margins.top;

        // 7. Encabezados HTTP para PDF y nombre del archivo dinámico
        const fileName = `${year.year}-${grade.grade}${section.seccion}_${studentPerson.names.replace(/\s/g, '_')}_${studentPerson.lastNames.replace(/\s/g, '_')}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`
        );

        doc.pipe(res);


        // 8. Contenido del PDF

        // ## CUADRO DE ENCABEZADO
        const headerRectHeight = 60;
        const headerRectY = y;
        doc.rect(startX, headerRectY, page_width, headerRectHeight).stroke();

        doc
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('REPORTE DE RENDIMIENTO ACADÉMICO', startX, headerRectY + 5, { align: 'center', width: page_width });

        doc.font('Helvetica').fontSize(10);
        const col1Width = page_width / 2;
        const col2Width = page_width / 2;

        doc.text(`Año: ${year.year}`, startX + 5, headerRectY + 30, { width: col1Width });
        doc.text(`Tutor: ${tutorName}`, startX + col1Width + 5, headerRectY + 30, { width: col2Width });

        doc.text(`Estudiante: ${studentPerson.names} ${studentPerson.lastNames}`, startX + 5, headerRectY + 45, { width: col1Width });
        doc.text(`Grado/Sección: ${grade.grade} "${section.seccion}"`, startX + col1Width + 5, headerRectY + 45, { width: col2Width });

        y = headerRectY + headerRectHeight + 15; // Mover Y debajo del cuadro

        // ## TABLA DE CALIFICACIONES (18 COLUMNAS DE CALIFICACIONES + 2 DE TEXTO/FINAL)
        const cellHeight = 30;
        const blockCount = 4;
        const blockInnerColumns = 4; // Calif. Diaria, Prácticas, Exámenes, Prom. Bloque
        const totalValueColumns = (blockCount * blockInnerColumns) + 1; // 16 + Prom. Final

        // Asignar ancho: Curso: 15% (aprox 100), Valores: 85% (aprox 630). 
        // 730 / 17 celdas de valor (16 bloques + 1 final) = 42.94
        const courseColWidth = 100;
        const totalValuesWidth = page_width - courseColWidth;
        const valueColWidth = totalValuesWidth / totalValueColumns; 


        // --- Cabecera de tabla: Fila 1 (Cursos y Bloques) ---
        let currentX = startX;
        doc.fontSize(8).font('Helvetica-Bold');
        doc.rect(currentX, y, courseColWidth, cellHeight * 2).fillAndStroke('#CCCCCC', '#000000'); // Fondo gris claro para cabecera
        doc.fill('#000000').text('Curso', currentX, y + cellHeight/2, { 
             width: courseColWidth, align: 'center' 
        });
        currentX += courseColWidth;


        for (let b = 1; b <= blockCount; b++) {
            const blockColWidth = valueColWidth * blockInnerColumns;
            doc.rect(currentX, y, blockColWidth, cellHeight).fillAndStroke('#CCCCCC', '#000000');
            doc.fill('#000000').text(`BLOQUE ${b}`, currentX, y + 4, { 
                width: blockColWidth, align: 'center' 
            });
            currentX += blockColWidth;
        }

        // Promedio Final
        doc.rect(currentX, y, valueColWidth, cellHeight * 2).fillAndStroke('#CCCCCC', '#000000');
        doc.fill('#000000').text('Prom. Final', currentX, y + cellHeight/2, { 
             width: valueColWidth, align: 'center' 
        });

        y += cellHeight;


        // --- Cabecera de tabla: Fila 2 (Detalle del Bloque) ---
        currentX = startX + courseColWidth; // Empieza después de 'Curso'
        doc.fontSize(7).font('Helvetica-Bold');

        const blockHeaders = ['Calif. Diaria', 'Prácticas', 'Exámenes', 'Prom. Bloque'];

        for (let b = 1; b <= blockCount; b++) {
            blockHeaders.forEach((header) => {
                doc.rect(currentX, y, valueColWidth, cellHeight).fillAndStroke('#CCCCCC', '#000000');
                doc.fill('#000000').text(header, currentX, y + 4, { 
                    width: valueColWidth, align: 'center' 
                });
                currentX += valueColWidth;
            });
        }
        // No hay detalle para Prom. Final, ya se dibujó en la Fila 1


        y += cellHeight; // Mover Y para empezar las filas de datos

        // --- Filas de cursos (Máximo 11 filas de datos + encabezado = 12 total) ---
        doc.fontSize(8).font('Helvetica');
        let rowCount = 0;

        for (const ca of courseAverages) {
            const courseName = ca.teachergroups?.courses?.course || '---';
            const assignmentId = ca.assignmentId;
            currentX = startX;

            // Columna de Curso
            drawCell(doc, courseName, currentX, y, courseColWidth, cellHeight, 'left');
            currentX += courseColWidth;


            // Columnas de Bloques
            for (let blockNum = 1; blockNum <= blockCount; blockNum++) {
                // ... (Lógica para obtener block, daily, practice, exam, blockAvg) ...
                const key = `${assignmentId}-${blockNum}`;
                const block = blockMap[key];

                // *********** VERIFICACIÓN CRÍTICA ***********
                // Asegurar que los valores convertidos a cadena sean números o guiones
                const daily = block?.dailyAvarage != null && !isNaN(block.dailyAvarage)
                    ? Number(block.dailyAvarage).toFixed(2)
                    : '-';

                const practice = block?.practiceAvarage != null && !isNaN(block.practiceAvarage)
                    ? Number(block.practiceAvarage).toFixed(2)
                    : '-';

                const exam = block?.examAvarage != null && !isNaN(block.examAvarage)
                    ? Number(block.examAvarage).toFixed(2)
                    : '-';

                const blockAvg = block?.teachingBlockAvarage != null && !isNaN(block.teachingBlockAvarage)
                    ? Number(block.teachingBlockAvarage).toFixed(2)
                    : '-';
                // **********************************************

                const values = [daily, practice, exam, blockAvg];

                values.forEach((val) => {
                    drawCell(doc, val, currentX, y, valueColWidth, cellHeight, 'center');
                    currentX += valueColWidth;
                });
            }

            // Promedio Final
            const finalAvg = ca.courseAverage != null && !isNaN(ca.courseAverage)
                ? Number(ca.courseAverage).toFixed(2)
                : '-';
                
            drawCell(doc, finalAvg, currentX, y, valueColWidth, cellHeight, 'center');

            y += cellHeight;
            rowCount++;

            // Detener si excede las 11 filas de datos + encabezado (12)
            if (rowCount >= 11) break;
        }

        doc.moveDown(1.5);
        y = doc.y;

        // ## CUADRO DE PIE DE PÁGINA (Promedio General y Estado)
        const footerRectHeight = 35;
        const footerRectY = y;
        doc.rect(startX, footerRectY, page_width, footerRectHeight).stroke();

        const annualAverage = annual?.average != null ? Number(annual.average).toFixed(2) : '---';
        const approvalStatus = getApprovalStatus(annual?.average);

        const statusColor = approvalStatus === 'APROBADO' ? '#008000' : '#FF0000'; // Verde o Rojo
        const statusText = `ESTADO: ${approvalStatus}`;
        const avgText = `Promedio General del Estudiante: ${annualAverage}`;

        const avgWidth = page_width * 0.7; // 70% para promedio
        const statusWidth = page_width * 0.3; // 30% para estado

        doc.fontSize(10).font('Helvetica').text(avgText, startX + 5, footerRectY + 12, {
            width: avgWidth,
            align: 'left'
        });
        
        doc.fontSize(12).font('Helvetica-Bold').fill(statusColor);
        doc.text(statusText, startX + avgWidth, footerRectY + 10, {
            width: statusWidth - 5,
            align: 'right'
        });
        doc.fill('#000000'); // Restaurar color a negro

        doc.end();
    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).json({
                message: 'Error generando reporte',
                error: err.message,
            });
        }
    }
};

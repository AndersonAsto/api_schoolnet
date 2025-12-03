const PDFDocument = require('pdfkit');
const db = require('../models');

// ===== Helpers genéricos =====

const drawCell = (doc, text, x, y, width, height, align = 'left') => {
    doc.rect(x, y, width, height).stroke();
    const textY = y + (height / 2) - (doc.currentLineHeight() / 2);
    doc.text(text, x, textY, {
        width,
        align,
        ellipsis: true
    });
};

const getApprovalStatus = (average) => {
    if (average == null) return '---';
    const numAvg = Number(average);
    return numAvg >= 11 ? 'APROBADO' : 'DESAPROBADO';
};

// ===== Helpers de datos (BD) =====

async function getYearOrThrow(yearId) {
    const year = await db.Years.findByPk(yearId);
    if (!year) {
        const error = new Error('YEAR_NOT_FOUND');
        throw error;
    }
    return year;
}

async function getEnrollmentOrThrow(studentEnrollmentId) {
    const enrollment = await db.StudentEnrollments.findByPk(
        studentEnrollmentId,
        {
            include: [
                { model: db.Persons, as: 'persons' },
                { model: db.Grades, as: 'grades' },
                { model: db.Sections, as: 'sections' },
            ],
        }
    );

    if (!enrollment) {
        const error = new Error('ENROLLMENT_NOT_FOUND');
        throw error;
    }

    return enrollment;
}

async function getTutorName(enrollment) {
    const tutorTeacher = await db.Tutors.findOne({
        where: {
            gradeId: enrollment.gradeId,
            sectionId: enrollment.sectionId,
        },
        include: [
            {
                model: db.TeacherAssignments,
                as: 'teachers',
                include: [{ model: db.Persons, as: 'persons' }],
            },
        ],
    });

    if (!tutorTeacher?.teachers?.persons) return 'No asignado';

    const p = tutorTeacher.teachers.persons;
    return `${p.names} ${p.lastNames}`;
}

async function getCourseAverages(yearId, studentEnrollmentId) {
    return db.OverallCourseAverage.findAll({
        where: {
            yearId,
            studentId: studentEnrollmentId,
        },
        include: [
            {
                model: db.TeacherGroups,
                as: 'teachergroups',
                include: [{ model: db.Courses, as: 'courses' }],
            },
        ],
        order: [
            [
                db.Sequelize.literal('`teachergroups->courses`.`course`'),
                'ASC',
            ],
        ],
    });
}

async function getBlocks(assignmentIds, studentEnrollmentId) {
    return db.TeachingBlockAverage.findAll({
        where: {
            assignmentId: assignmentIds,
            studentId: studentEnrollmentId,
        },
        include: [{ model: db.TeachingBlocks, as: 'teachingblocks' }],
    });
}

function buildBlockMap(blocks) {
    const blockMap = {};
    blocks.forEach((b) => {
        const key = `${b.assignmentId}-${b.teachingBlockId}`;
        blockMap[key] = b;
    });
    return blockMap;
}

async function getAnnualAverage(yearId, studentEnrollmentId) {
    return db.AnnualAverage.findOne({
        where: {
            yearId,
            studentId: studentEnrollmentId,
        },
    });
}

// ===== Helpers de PDF: estructura general =====

function createPdfDoc(res, year, grade, section, studentPerson) {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const fileName = `${year.year}-${grade.grade}${section.seccion}_` +
        `${studentPerson.names.replace(/\s/g, '_')}_` +
        `${studentPerson.lastNames.replace(/\s/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);
    return doc;
}

function drawHeader(doc, year, tutorName, studentPerson, grade, section, pageWidth, startX, startY) {
    const headerRectHeight = 60;
    const headerRectY = startY;

    doc.rect(startX, headerRectY, pageWidth, headerRectHeight).stroke();

    doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('REPORTE DE RENDIMIENTO ACADÉMICO',
            startX,
            headerRectY + 5,
            { align: 'center', width: pageWidth }
        );

    doc.font('Helvetica').fontSize(10);
    const col1Width = pageWidth / 2;
    const col2Width = pageWidth / 2;

    doc.text(`Año: ${year.year}`, startX + 5, headerRectY + 30, { width: col1Width });
    doc.text(`Tutor: ${tutorName}`, startX + col1Width + 5, headerRectY + 30, { width: col2Width });

    doc.text(
        `Estudiante: ${studentPerson.names} ${studentPerson.lastNames}`,
        startX + 5,
        headerRectY + 45,
        { width: col1Width }
    );
    doc.text(
        `Grado/Sección: ${grade.grade} "${section.seccion}"`,
        startX + col1Width + 5,
        headerRectY + 45,
        { width: col2Width }
    );

    return headerRectY + headerRectHeight + 15; // new y
}

// ===== Helpers de PDF: tabla =====

function getTableLayout(pageWidth) {
    const cellHeight = 30;
    const blockCount = 4;
    const blockInnerColumns = 4;
    const totalValueColumns = (blockCount * blockInnerColumns) + 1;

    const courseColWidth = 100;
    const totalValuesWidth = pageWidth - courseColWidth;
    const valueColWidth = totalValuesWidth / totalValueColumns;

    return {
        cellHeight,
        blockCount,
        blockInnerColumns,
        totalValueColumns,
        courseColWidth,
        valueColWidth,
    };
}

function drawTableHeader(doc, startX, y, layout) {
    const {
        cellHeight,
        blockCount,
        blockInnerColumns,
        courseColWidth,
        valueColWidth,
    } = layout;

    let currentX = startX;
    doc.fontSize(8).font('Helvetica-Bold');

    // Columna Curso
    doc.rect(currentX, y, courseColWidth, cellHeight * 2).fillAndStroke('#CCCCCC', '#000000');
    doc.fill('#000000').text('Curso', currentX, y + cellHeight / 2, {
        width: courseColWidth,
        align: 'center'
    });
    currentX += courseColWidth;

    // Bloques
    for (let b = 1; b <= blockCount; b++) {
        const blockColWidth = valueColWidth * blockInnerColumns;
        doc.rect(currentX, y, blockColWidth, cellHeight).fillAndStroke('#CCCCCC', '#000000');
        doc.fill('#000000').text(`BLOQUE ${b}`, currentX, y + 4, {
            width: blockColWidth,
            align: 'center'
        });
        currentX += blockColWidth;
    }

    // Promedio final
    doc.rect(currentX, y, valueColWidth, cellHeight * 2).fillAndStroke('#CCCCCC', '#000000');
    doc.fill('#000000').text('Prom. Final', currentX, y + cellHeight / 2, {
        width: valueColWidth,
        align: 'center'
    });

    // Segunda fila de encabezados (detalle bloques)
    y += cellHeight;
    currentX = startX + courseColWidth;
    doc.fontSize(7).font('Helvetica-Bold');

    const blockHeaders = ['Calif. Diaria', 'Prácticas', 'Exámenes', 'Prom. Bloque'];

    for (let b = 1; b <= blockCount; b++) {
        blockHeaders.forEach((header) => {
            doc.rect(currentX, y, valueColWidth, cellHeight).fillAndStroke('#CCCCCC', '#000000');
            doc.fill('#000000').text(header, currentX, y + 4, {
                width: valueColWidth,
                align: 'center'
            });
            currentX += valueColWidth;
        });
    }

    return y + cellHeight; // nueva Y para las filas de datos
}

function formatBlockValues(block) {
    const safeNum = (val) =>
        val != null && !isNaN(val) ? Number(val).toFixed(2) : '-';

    return [
        safeNum(block?.dailyAvarage),
        safeNum(block?.practiceAvarage),
        safeNum(block?.examAvarage),
        safeNum(block?.teachingBlockAvarage),
    ];
}

function drawCourseRows(doc, courseAverages, blockMap, layout, startX, startY) {
    const {
        cellHeight,
        blockCount,
        courseColWidth,
        valueColWidth,
    } = layout;

    doc.fontSize(8).font('Helvetica');

    let y = startY;
    let rowCount = 0;

    for (const ca of courseAverages) {
        const courseName = ca.teachergroups?.courses?.course || '---';
        const assignmentId = ca.assignmentId;
        let currentX = startX;

        // Columna curso
        drawCell(doc, courseName, currentX, y, courseColWidth, cellHeight, 'left');
        currentX += courseColWidth;

        // Bloques
        for (let blockNum = 1; blockNum <= blockCount; blockNum++) {
            const key = `${assignmentId}-${blockNum}`;
            const block = blockMap[key];
            const values = formatBlockValues(block);

            values.forEach((val) => {
                drawCell(doc, val, currentX, y, valueColWidth, cellHeight, 'center');
                currentX += valueColWidth;
            });
        }

        // Promedio final del curso
        const finalAvg = ca.courseAverage != null && !isNaN(ca.courseAverage)
            ? Number(ca.courseAverage).toFixed(2)
            : '-';

        drawCell(doc, finalAvg, currentX, y, valueColWidth, cellHeight, 'center');

        y += cellHeight;
        rowCount++;

        if (rowCount >= 11) break; // máximo 11 filas
    }

    return y;
}

// ===== Helpers de PDF: footer =====

function drawFooter(doc, annual, pageWidth, startX, startY) {
    const footerRectHeight = 35;
    const footerRectY = startY;

    doc.rect(startX, footerRectY, pageWidth, footerRectHeight).stroke();

    const annualAverage = annual?.average != null
        ? Number(annual.average).toFixed(2)
        : '---';

    const approvalStatus = getApprovalStatus(annual?.average);
    const statusColor = approvalStatus === 'APROBADO' ? '#008000' : '#FF0000';
    const statusText = `ESTADO: ${approvalStatus}`;
    const avgText = `Promedio General del Estudiante: ${annualAverage}`;

    const avgWidth = pageWidth * 0.7;
    const statusWidth = pageWidth * 0.3;

    doc.fontSize(10).font('Helvetica').text(avgText, startX + 5, footerRectY + 12, {
        width: avgWidth,
        align: 'left'
    });

    doc.fontSize(12).font('Helvetica-Bold').fill(statusColor);
    doc.text(statusText, startX + avgWidth, footerRectY + 10, {
        width: statusWidth - 5,
        align: 'right'
    });

    doc.fill('#000000'); // reset color
}

// ===== Controlador principal =====

exports.generateReportByYearAndStudent = async (req, res) => {
    const { studentEnrollmentId, yearId } = req.params;

    try {
        // 1. Datos base
        const year = await getYearOrThrow(yearId);
        const enrollment = await getEnrollmentOrThrow(studentEnrollmentId);
        const studentPerson = enrollment.persons;
        const grade = enrollment.grades;
        const section = enrollment.sections;

        const tutorName = await getTutorName(enrollment);

        // 2. Promedios y bloques
        const courseAverages = await getCourseAverages(yearId, studentEnrollmentId);
        const assignmentIds = courseAverages.map((ca) => ca.assignmentId);
        const blocks = await getBlocks(assignmentIds, studentEnrollmentId);
        const blockMap = buildBlockMap(blocks);
        const annual = await getAnnualAverage(yearId, studentEnrollmentId);

        // 3. Configuración PDF
        const doc = createPdfDoc(res, year, grade, section, studentPerson);
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const startX = doc.page.margins.left;
        let y = doc.page.margins.top;

        // 4. Header
        y = drawHeader(doc, year, tutorName, studentPerson, grade, section, pageWidth, startX, y);

        // 5. Tabla
        const layout = getTableLayout(pageWidth);
        y = drawTableHeader(doc, startX, y, layout);
        y = drawCourseRows(doc, courseAverages, blockMap, layout, startX, y);

        doc.moveDown(1.5);
        y = doc.y;

        // 6. Footer
        drawFooter(doc, annual, pageWidth, startX, y);

        doc.end();
    } catch (error) {
        console.error(error.message);

        if (error.message === 'YEAR_NOT_FOUND') {
            return res.status(404).json({ message: 'Año no encontrado' });
        }
        if (error.message === 'ENROLLMENT_NOT_FOUND') {
            return res.status(404).json({ message: 'Matrícula de estudiante no encontrada' });
        }

        return res
            .status(500)
            .json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

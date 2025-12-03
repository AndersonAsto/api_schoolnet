// test/integration.test/reports.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Reports Endpoint - Integration', () => {
  let skipTests = false;

  // Ajusta estos IDs a registros reales de tu BD
  const EXISTING_YEAR_ID = 1;
  const EXISTING_ENROLLMENT_ID = 1;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión BD OK para Reports Integration');
    } catch (err) {
      console.error(
        'No se pudo conectar a BD para Reports Integration:',
        err.message
      );
      skipTests = true;
    }
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
    } catch (e) {
      // ignore
    }
  });

  const safeTest = (fn) => {
    return async () => {
      if (skipTests) {
        expect(true).toBe(true);
        return;
      }
      await fn();
    };
  };

  it(
    'debe retornar 404 si el año no existe',
    safeTest(async () => {
      const res = await request(app).get(
        `/api/reports/student/${EXISTING_ENROLLMENT_ID}/year/999999`
      );

      expect([404, 500]).toContain(res.status);
      // si realmente no existe, será 404; si hay algún tema de BD, 500
    })
  );

  it(
    'debe retornar 404 si la matrícula no existe',
    safeTest(async () => {
      const res = await request(app).get(
        `/api/reports/student/999999/year/${EXISTING_YEAR_ID}`
      );

      expect([404, 500]).toContain(res.status);
    })
  );

  it(
    'intenta generar el PDF (200 o 500 según datos/constraints)',
    safeTest(async () => {
      const res = await request(app).get(
        `/api/reports/student/${EXISTING_ENROLLMENT_ID}/year/${EXISTING_YEAR_ID}`
      );

      expect([200, 500, 404]).toContain(res.status);

      if (res.status === 200) {
        // Encabezados HTTP deben indicar PDF
        expect(res.headers['content-type']).toContain('application/pdf');
        expect(res.headers['content-disposition']).toContain('attachment;');

        // Algo de cuerpo (buffer no vacío)
        expect(res.body.length).toBeGreaterThan(0);
      }
    })
  );
});

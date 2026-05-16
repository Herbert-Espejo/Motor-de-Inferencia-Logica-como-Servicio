const { app, KB_PATH } = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\nMotor de Inferencia Lógica ejecutándose en http://localhost:${PORT}`);
  console.log('Motor: Tau Prolog');
  console.log(`Base de conocimiento: ${KB_PATH}`);
  console.log('Endpoints disponibles:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/api`);
  console.log(`  POST http://localhost:${PORT}/query`);
  console.log(`  GET  http://localhost:${PORT}/facts`);
  console.log(`  GET  http://localhost:${PORT}/health\n`);
});

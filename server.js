import app from './backend/app.js';
import { PORT } from './backend/config/env.js';

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(` Casewise API Server running at:`);
  console.log(` http://localhost:${PORT}`);
  console.log(` Ready for requests from Vite frontend.`);
  console.log(`========================================\n`);
});

import { PORT } from './config/env';
import app from './app';

app.listen(PORT, () => {
  console.log(`Backend listening at http://localhost:${PORT}`);
});

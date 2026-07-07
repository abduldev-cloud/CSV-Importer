import express from 'express';
import cors from 'cors';
import { config } from './config';
import router from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors({
  origin: config.corsOrigin,
}));

// Allow parsing larger payloads for incoming CSV rows data arrays (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Register routes
app.use('/', router);

// Register the error handling middleware (must be registered after all other routes)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port} in ${config.nodeEnv} mode`);
});

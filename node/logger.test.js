
const logger = require('./logger');

logger.on('*', console.log);
logger.on('WARNING', console.log);

logger.log('INFO', 'test');
logger.log('WARNING', 'test');

// @ts-check

const logger = require('../core/logger');
const logger_to_file = require('./logger_to_file');

const severity_types = logger.severity_types;

logger_to_file.enable('*');

logger.log('test', severity_types.INFO, 'Test message # 1 (should show).', { foo: 'bar' });
logger.log('test2', severity_types.INFO, 'Test message # 2 (should show).', { foo: 'bar' });
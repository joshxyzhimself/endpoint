
// @ts-check

const logger = require('./logger');

const severity_types = logger.severity_types;

logger.to_console('*');
logger.to_file('*');

logger.log('test', severity_types.INFO, 'Test message # 1 (should show).', { foo: 'bar' });
logger.log('test2', severity_types.INFO, 'Test message # 2 (should show).', { foo: 'bar' });
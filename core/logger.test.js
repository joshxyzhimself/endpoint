
const logger = require('./logger');

const severity_types = logger.severity_types;

logger.enable_console_logs('test');

logger.log('test', severity_types.INFO, 'Test message # 1 (should show).', { foo: 'bar' });
logger.log('test2', severity_types.INFO, 'Test message # 2 (should not show).', { foo: 'bar' });

logger.disable_console_logs('test');

logger.log('test', severity_types.INFO, 'Test message # 3 (should not show).', { foo: 'bar' });

logger.enable_console_logs('*');

logger.log('test', severity_types.INFO, 'Test message # 4 (should show).', { foo: 'bar' });
logger.log('test2', severity_types.INFO, 'Test message # 5 (should show).', { foo: 'bar' });

logger.disable_console_logs('*');

logger.log('test', severity_types.INFO, 'Test message # 6 (should not show).', { foo: 'bar' });
logger.log('test2', severity_types.INFO, 'Test message # 7 (should not show).', { foo: 'bar' });
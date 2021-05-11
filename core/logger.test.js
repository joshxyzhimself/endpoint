
const logger = require('./logger');

const severity_types = logger.severity_types;

// Should show
logger.enable_console_logs();
logger.log('test', severity_types.INFO, 'Test message # 1.', { foo: 'bar' });

// Should not show
logger.disable_console_logs();
logger.log('test', severity_types.INFO, 'Test message # 2.', { foo: 'bar' });
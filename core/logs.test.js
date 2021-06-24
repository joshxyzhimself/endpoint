
// @ts-check

const logs = require('./logs');

process.nextTick(async () => {

  logs.on('*', (entry) => {

    // Flexible destinations: console, vector.dev, apex logs, grafana's loki
    // Subscribe by *, resource.id, operation.id, severity.type, severity.code

    if (entry.severity.code >= logs.severity_codes.ERROR) {
      console.error(JSON.stringify(entry, null, 2));
    } else {
      console.log(JSON.stringify(entry, null, 2));
    }

  });

  const resource = 'test_resource';
  const operation = 'test_operation';

  const input = { foo: 'bar' };

  try {
    logs.emit({
      resource,
      operation,
      message: 'test',
      severity: { type: logs.severity_types.INFO },
    });
    logs.emit({
      resource,
      operation,
      data: { input },
      severity: { type: logs.severity_types.INFO },
    });
    throw new Error('test_error');
  } catch (e) {
    logs.emit({
      resource,
      operation,
      data: { input },
      error: logs.capture_error(e),
      severity: { type: logs.severity_types.ERROR },
    });
  }
});
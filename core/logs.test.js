
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

  const resource_id = 'test_resource';
  const operation_id = 'test_operation';

  const input = { foo: 'bar' };

  try {
    logs.emit({
      resource_id,
      operation_id,
      message: 'test',
      severity: { type: logs.severity_types.INFO, code: logs.severity_codes.INFO },
      trace: { mts: Date.now() },
    });
    logs.emit({
      resource_id,
      operation_id,
      data: { input },
      severity: { type: logs.severity_types.INFO, code: logs.severity_codes.INFO },
      trace: { mts: Date.now() },
    });
    throw new Error('test_error');
  } catch (e) {
    logs.emit({
      resource_id,
      operation_id,
      data: { input },
      error: logs.capture_error(e),
      severity: { type: logs.severity_types.ERROR, code: logs.severity_codes.ERROR },
      trace: { mts: Date.now() },
    });
  }
});
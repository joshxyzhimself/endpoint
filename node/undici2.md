## undici2

### Notes

- default timeout is 30 seconds (built-in)
- must `assert(response.status === 200);`
- optional handling by `if (response.status >= 500) {}`
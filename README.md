# LoopBack SocketHook
LoopBack.io component for connect to API over socket.io.

This component allow you to use models' methods over socket events such as HTTP-requests to LoopBack API.

All documented routes of API transform into socket events in the following format:
```
model:method
```
## How to install
1. Install npm package

  ```
  npm i loopback-hook-socket
  ```

2. Add to server/component-config.json declaration of component

  ```
  {
    "loopback-hook-socket" : {}
  }
  ```
3. View explorer of socket events

## Configuration

| Option | Description | Type | Default |
|--------|-------------|-----|----|
| port | port of Socket Server | Number | 3030 |
| enabled | enabled\disabled component | Boolean | true |
| errorEvent | name of error event | String | error |
| apiURI | LoopBack API URI | String | http://127.0.0.1:3000/api |
| eventView | enabled\disabled explorer of socket events | Boolean | true |
| mountPath | mount path of explorer of socket events | String | /socket-hook-explorer |

You could override default configuration parameters. Simply add this parameter to component's declaration in server/component-config.json.

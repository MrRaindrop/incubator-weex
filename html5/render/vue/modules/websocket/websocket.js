/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * websocket module
 */
// let instance = null

export default (function () {
  let instance = null
  const registerListeners = ['onopen', 'onmessage', 'onerror', 'onclose']
  const ws = {
    hasOwnProperty: function (e) {
      return true
    },
    WebSocket: function (url, protocol) {
      if (!url) {
        return
      }
      if (!protocol) {
        instance = new WebSocket(url)
      }
      else {
        instance = new WebSocket(url, protocol)
      }
      return instance
    },
    send: function (messages) {
      instance && instance.send(messages)
    },
    close: function () {
      instance && instance.close()
    }
  }
  for (const i in registerListeners) {
    if (registerListeners.hasOwnProperty(i)) {
      Object.defineProperty(ws, registerListeners[i], {
        get: function () {
          return instance && instance[registerListeners[i]]
        },
        set: function (fn) {
          if (instance) {
            instance[registerListeners[i]] = fn
          }
        }
      })
    }
  }
  return ws
})()
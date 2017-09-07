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
const _css = `
body > .weex-div {
  min-height: 100%;
}
`

let idCount = 0
const functional = true

function getDiv (weex) {
  const {
    extractComponentStyle,
    trimTextVNodes
  } = weex
  const {
    watchAppear,
    extend
  } = weex.utils

  return {
    functional,
    name: 'weex-div',
    render (createElement, context) {
      const id = `wx-div-${idCount++}`
      context.parent.$nextTick(function () {
        watchAppear(context, {
          functional,
          id
        }, true)
      })
      return createElement('html:div', extend({}, context.data, {
        attrs: {
          'weex-type': 'div',
          'data-weex-id': id
        },
        staticClass: 'weex-div weex-ct',
        staticStyle: extractComponentStyle(context, { functional, id })
      }), trimTextVNodes(context.children))
    },
    _css
  }
}

export default {
  init (weex) {
    const div = getDiv(weex)
    weex.registerComponent('div', div)
    weex.registerComponent('container', div)
  }
}

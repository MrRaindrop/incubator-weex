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
 * @fileOverview Impl of text component.
 *
 * Notes about the style 'height' and 'lines':
 * if the computed value of 'height' is bigger than 'lines', than the text will
 * be clipped according to the 'lines'. Otherwise, it'll be the 'height'.
 */
const _css = `
.weex-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  position: relative;
  white-space: pre-wrap;  /* not using 'pre': support auto line feed. */
  font-size: 0.426667rem;
  word-wrap: break-word;
  overflow: hidden; /* it'll be clipped if the height is not high enough. */
}
`

/**
 * Get text special styles (lines and text-overflow).
 */
function getTextSpecStyle (ms = {}) {
  const lines = parseInt(ms.lines) || 0
  const overflow = ms['text-overflow'] || 'ellipsis'
  if (lines > 0) {
    return {
      overflow: 'hidden',
      'text-overflow': overflow,
      '-webkit-line-clamp': lines
    }
  }
}

let idCount = 0

function getText (weex) {
  const {
    extractComponentStyle,
    setFunctionalContextToDomElement
  } = weex
  const { extend } = weex.utils
  const functional = true

  return {
    name: 'weex-text',
    functional,
    props: {
      lines: [Number, String],
      value: [String]
    },

    render (createElement, context) {
      const id = `wx-text-${idCount++}`
      setFunctionalContextToDomElement(context, id)
      const style = extractComponentStyle(context, { functional, id })
      const textSpecStyle = getTextSpecStyle(style)
      const data = extend({}, context.data, {
        attrs: {
          'weex-type': 'text',
          'data-weex-id': id
        },
        staticClass: 'weex-text weex-el',
        staticStyle: extend(style, textSpecStyle)
      })
      delete data.on
      return createElement('html:p', data, context.children || [this.value])
    },
    _css
  }
}

export default {
  init (weex) {
    weex.registerComponent('text', getText(weex))
  }
}

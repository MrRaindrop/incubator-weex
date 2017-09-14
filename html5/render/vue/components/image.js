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

let extractComponentStyle,
  extend,
  watchAppear

const IMG_NAME_BITS = 15

const _css = `
.weex-image, .weex-img {
  background-repeat: no-repeat;
  background-position: 50% 50%;
}
`

let idCount = 0

/**
 * get resize (stetch|cover|contain) related styles.
 */
function getResizeStyle (context, functional) {
  const stretch = '100% 100%'
  const resize = (functional ? context.props.resize : context.resize) || stretch
  const bgSize = ['cover', 'contain', stretch].indexOf(resize) > -1 ? resize : stretch
  // compatibility: http://caniuse.com/#search=background-size
  return { 'background-size': bgSize }
}

function preProcessSrc (context, url, mergedStyle, functional) {
  // somehow the merged style in _prerender hook is gone.
  // just return the original src.
  if (!mergedStyle || !mergedStyle.width || !mergedStyle.height) {
    return url
  }
  const props = functional ? context.props || {} : context
  const { width, height } = mergedStyle
  const vm = functional ? context.parent : context
  return vm.processImgSrc && vm.processImgSrc(url, {
    width: parseFloat(width),
    height: parseFloat(height),
    quality: props.quality,
    sharpen: props.sharpen,
    original: props.original
  }) || url
}

function download (url, callback) {
  function success () {
    callback && callback({
      success: true
    })
  }
  function fail (err) {
    callback && callback({
      success: false,
      errorDesc: err + ''
    })
  }
  try {
    let isDataUrl = false
    let parts
    let name
    if (url.match(/data:image\/[^;]+;base64,/)) {
      isDataUrl = true
      parts = url.split(',')
    }
    if (!isDataUrl) {
      name = url
        .replace(/\?[^?]+/, '')
        .replace(/#[^#]+/, '')
        .match(/([^/]+)$/)
    }
    else {
      name = parts[1].substr(0, IMG_NAME_BITS)
    }
    const aEl = document.createElement('a')
    aEl.href = url
    /**
     * Not all browser support this 'download' attribute. In these browsers it'll jump
     * to the photo url page and user have to longpress the photo to save it.
     */
    aEl.download = name
    const clickEvt = new Event('click', { bubbles: false })
    aEl.dispatchEvent(clickEvt)
    success()
  }
  catch (err) {
    fail(err)
  }
}

const functional = true
const image = {
  name: 'weex-image',
  functional,
  props: {
    src: String,
    placeholder: String,
    resize: String,
    quality: String,
    sharpen: String,
    original: [String, Boolean]
  },

  methods: {
    save (callback) {
      download(this.src, callback)
    }
  },

  render (createElement, context) {
    const { src, placeholder } = context.props || {}
    const id = `wx-image-${idCount++}`
    context._functional = true
    context._id = id
    weex._functionalContext[id] = context
    watchAppear(context, { nextTick: true }, true)
    weex.__vue__.nextTick(function () {
      context.parent._fireLazyload()
    })
    const resizeStyle = getResizeStyle(context, functional)
    const style = extractComponentStyle(context, { functional, id })
    const data = extend({}, context.data, {
      attrs: {
        'weex-type': 'image',
        'data-weex-id': id,
        'img-src': preProcessSrc(context, src, style, functional),
        'img-placeholder': preProcessSrc(context, placeholder, style, functional)
      },
      staticClass: 'weex-image weex-el',
      staticStyle: extend(style, resizeStyle)
    })
    delete data.on
    return createElement('figure', data)
  },
  _css
}

export default {
  init (weex) {
    extractComponentStyle = weex.extractComponentStyle
    extend = weex.utils.extend
    watchAppear = weex.utils.watchAppear

    weex.registerComponent('image', image)
    weex.registerComponent('img', image)
  }
}

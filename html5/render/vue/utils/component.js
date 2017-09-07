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
import { throttle, extend } from './func'
import { createEvent } from './event'
import config from '../config'

export function getParentScroller (context, functional) {
  const vm = functional ? context.parent : context
  if (!vm) return null
  if (vm._parentScroller) {
    return vm._parentScroller
  }
  function _getParentScroller (parent) {
    if (!parent || !parent.$el) { return }
    if (config.scrollableTypes.indexOf(parent.$el.getAttribute('weex-type')) > -1) {
      vm._parentScroller = parent
      return parent
    }
    return _getParentScroller(parent.$parent)
  }
  const parentVm = functional ? vm : vm.$parent
  return _getParentScroller(parentVm)
}

export function hasIntersection (rect, ctRect) {
  return (rect.left < ctRect.right && rect.right > ctRect.left)
    && (rect.top < ctRect.bottom && rect.bottom > ctRect.top)
}

/**
 * isElementVisible
 * @param  {HTMLElement}  el    a dom element.
 * @param  {HTMLElement}  container  optional, the container of this el.
 */
export function isElementVisible (el, container) {
  if (!el.getBoundingClientRect) { return false }
  const bodyRect = {
    top: 0,
    left: 0,
    bottom: window.innerHeight,
    right: window.innerWidth
  }
  const ctRect = (container === document.body)
    ? bodyRect : container
    ? container.getBoundingClientRect() : bodyRect
  return hasIntersection(
    el.getBoundingClientRect(),
    ctRect)
}

export function isComponentVisible (component) {
  if (component.$el) {
    const scroller = getParentScroller(component)
    if (scroller && scroller.$el) {
      return hasIntersection(
        component.$el.getBoundingClientRect(),
        scroller.$el.getBoundingClientRect()
      )
    }
    else {
      return isElementVisible(component.$el)
    }
  }
  return false
}

// to trigger the appear/disappear event.
function triggerEvent (elm, handlers, isShow, dir) {
  const evt = isShow ? 'appear' : 'disappear'
  let listener = handlers[evt]
  if (listener && listener.fn) {
    listener = listener.fn
  }
  if (listener) {
    listener(createEvent(elm, evt, {
      direction: dir
    }))
  }
}

/**
 * get all event listeners. including bound handlers in all parent vnodes.
 */
export function getEventHandlers (context) {
  const handlers = {}
  if (context.listeners) {  // functional context
    return context.listeners
  }
  let vnode = context.$vnode
  if (!vnode) { return handlers }
  const attachedVnodes = []
  while (vnode) {
    attachedVnodes.push(vnode)
    vnode = vnode.parent
  }
  attachedVnodes.forEach(function (vnode) {
    const parentListeners = vnode.componentOptions && vnode.componentOptions.listeners
    const dataOn = vnode.data && vnode.data.on
    extend(handlers, parentListeners, dataOn)
  })
  return handlers
}

/**
 * Watch element's visibility to tell whether should trigger a appear/disappear
 * event in scroll handler.
 */
export function watchAppear (context, options, fireNow) {
  const { functional, id } = options || {}
  const { listeners } = context

  function getEl (context, id) {
    return context && context.$el
      // get functional element.
      || id && document.querySelector(`[data-weex-id="${id}"]`)
  }

  const el = getEl(context, id)
  if (!el) {
    return
  }
  functional && (context._elm = el)

  const handlers = functional ? listeners : getEventHandlers(context)
  if (!handlers.appear && !handlers.disappear) {
    return
  }

  let isWindow = false
  let container = document.body
  const scroller = getParentScroller(context, functional)
  if (scroller && scroller.$el) {
    container = scroller.$el
  }
  else {
    isWindow = true
  }

  // If fireNow, then test appear/disappear immediately.
  if (fireNow) {
    const visible = isElementVisible(el, container)
    detectAppear(context, visible)
  }

  // add current vm to the container's appear watch list.
  if (!container._watchAppearList) {
    container._watchAppearList = []
  }
  container._watchAppearList.push(context)

  if (!container._scrollWatched) {
    /**
     * Code below will only exec once for binding scroll handler for
     * parent container.
     */
    container._scrollWatched = true
    const scrollHandler = throttle(event => {
      /**
       * detect scrolling direction.
       * direction only support up & down yet.
       * TODO: direction support left & right.
       */
      const scrollTop = isWindow ? window.pageYOffset : container.scrollTop
      const preTop = container._lastScrollTop
      container._lastScrollTop = scrollTop
      const dir = scrollTop < preTop
        ? 'down' : scrollTop > preTop
        ? 'up' : null

      const watchAppearList = container._watchAppearList || []
      const len = watchAppearList.length
      for (let i = 0; i < len; i++) {
        const ctx = watchAppearList[i]
        const visible = isElementVisible(ctx.$el || ctx._elm, container)
        detectAppear(ctx, visible, dir)
      }
    }, 25, true)
    container.addEventListener('scroll', scrollHandler, false)
  }
}

/**
 * trigger a appear event.
 */
export function triggerAppear (context, visible) {
  if (!context || !context.$el) { return }
  if (!visible) {
    let container = document.body
    const scroller = getParentScroller(context)
    if (scroller && scroller.$el) {
      container = scroller.$el
    }
    visible = isElementVisible(context.$el, container)
  }
  return detectAppear(context, visible)
}

/**
 * trigger a disappear event.
 */
export function triggerDisappear (context) {
  return detectAppear(context, false)
}

/**
 * decide whether to trigger a appear/disappear event.
 * @param {VueComponent} context
 * @param {boolean} visible
 * @param {string} dir
 */
export function detectAppear (context, visible, dir = null) {
  const el = context && (context.$el || context._elm)
  if (!el) { return }
  const handlers = getEventHandlers(context)
  /**
   * No matter it's binding appear/disappear or both of them. Always
   * should test it's visibility and change the context._visible.
   * If neithor of them was bound, then just ignore it.
   */
  if (!handlers['appear'] && !handlers['disappear']) { return }
  /**
   * if the component hasn't appeared for once yet, then it shouldn't trigger
   * a disappear event at all.
   */
  if (!visible && !context._appearedOnce) { return }
  if (!context._visible === visible) {
    if (!context._appearedOnce) {
      context._appearedOnce = true
    }
    context._visible = visible
    triggerEvent(el, handlers, visible, dir)
  }
}

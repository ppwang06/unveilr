import { expose } from 'threads/worker'
import { isWorkerRuntime } from '@utils/isWorkerRuntime'
import { Observable, Subject } from 'threads/observable'
import { TraverseVisitorKeys, TraverseVisitorMap, TVSubjectType } from '@core/parser/wxapkg/types'
import { AppConfigParser } from '@core/parser/wxapkg/AppConfigParser'
import { Visitor } from '@babel/core'
import { WxssParser } from '@core/parser/wxapkg/WxssParser'
import { ScriptParser } from '@core/parser/wxapkg/ScriptParser'
import { TraverseController } from '@core/controller/TraverseController'

const subject = new Subject<TVSubjectType>()
const visitors: Partial<TraverseVisitorMap> = {}
const visitorsFn: Record<TraverseVisitorKeys, (subject1: typeof subject) => Visitor> = {
  AppConfigService: AppConfigParser.visitor,
  WxssParser: WxssParser.visitorSetCssToHead,
  WxssParserCommon: WxssParser.visitorCommonStyle,
  WxssParserCommon2: WxssParser.visitorCArray,
  ScriptParser: ScriptParser.visitor,
}

export function createExposed() {
  return {
    async startTraverse(code: string) {
      const tCtrl = new TraverseController({ code })
      tCtrl.addVisitors(...Object.values(visitors))
      return tCtrl.traverse()
    },
    setVisitor(...keys: Array<keyof TraverseVisitorMap>) {
      keys.forEach((key) => (visitors[key] = visitorsFn[key](subject)))
    },
    observable() {
      return Observable.from(subject)
    },
  }
}

if (isWorkerRuntime()) {
  expose(createExposed())
}

export const traverseModule = module
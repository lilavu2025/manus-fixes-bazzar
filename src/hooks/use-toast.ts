import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

// الحد الأقصى لعدد التنبيهات الظاهرة في نفس الوقت
const TOAST_LIMIT = 1

// المدة التي سيتم بعدها إزالة التنبيه (بالميلي ثانية)
const TOAST_REMOVE_DELAY = 1000000 // طويل جدًا الآن (لأغراض التطوير)

// تعريف نوع التنبيه الكامل
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

// أنواع الأحداث التي يمكن أن تحصل للتنبيهات
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

// عداد لتوليد معرفات فريدة لكل Toast
let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  const id = count.toString()
  console.log("[toast] Generated new toast ID:", id)
  return id
}

// تعريف أنواع الأحداث الممكنة
type ActionType = typeof actionTypes

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] }

// الحالة العامة التي تحتوي على جميع التنبيهات المفتوحة
interface State {
  toasts: ToasterToast[]
}

// تخزين المؤقتات لإزالة التوست بعد وقت معين
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// إضافة Toast إلى طابور الحذف بعد وقت معين
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return

  console.log("[toast] Adding toast to remove queue:", toastId)
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    console.log("[toast] Removing toast after timeout:", toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

// دالة إدارة الحالة الرئيسية (reducer)
export const reducer = (state: State, action: Action): State => {
  console.log("[toast reducer] Action received:", action.type, action)
  switch (action.type) {
    case "ADD_TOAST": {
      const newStateAdd = {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
      console.log("[toast reducer] Toast added:", action.toast)
      return newStateAdd
    }
    case "UPDATE_TOAST": {
      const newStateUpdate = {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }
      console.log("[toast reducer] Toast updated:", action.toast)
      return newStateUpdate
    }
    case "DISMISS_TOAST": {
      const { toastId } = action

      // إدخال التوست إلى طابور الحذف
      if (toastId) {
        console.log("[toast reducer] Dismissing toast by ID:", toastId)
        addToRemoveQueue(toastId)
      } else {
        console.log("[toast reducer] Dismissing ALL toasts")
        state.toasts.forEach((toast) => addToRemoveQueue(toast.id))
      }

      const newStateDismiss = {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      }
      return newStateDismiss
    }
    case "REMOVE_TOAST": {
      if (action.toastId === undefined) {
        console.log("[toast reducer] Removing ALL toasts")
        return { ...state, toasts: [] }
      }
      const newStateRemove = {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
      console.log("[toast reducer] Toast removed:", action.toastId)
      return newStateRemove
    }
  }
}

// القائمة التي تحتوي على جميع المستمعين للحالة
const listeners: Array<(state: State) => void> = []

// الحالة الحالية في الذاكرة
let memoryState: State = { toasts: [] }

// تنفيذ الإجراء وتحديث جميع المستمعين
function dispatch(action: Action) {
  console.log("[toast dispatch] Dispatching action:", action.type)
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

// نوع البيانات المطلوبة لإنشاء Toast جديد
type Toast = Omit<ToasterToast, "id">

// دالة لإنشاء Toast جديد
function toast({ ...props }: Toast) {
  const id = genId()

  // دالة لتحديث التوست لاحقًا
  const update = (props: ToasterToast) => {
    console.log("[toast] Updating toast:", id)
    dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })
  }

  // دالة لإغلاق التوست يدويًا
  const dismiss = () => {
    console.log("[toast] Dismissing toast:", id)
    dispatch({ type: "DISMISS_TOAST", toastId: id })
  }

  // إنشاء التوست فعليًا
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return { id, dismiss, update }
}

// هوك React لاستخدام التوست في المكونات
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    console.log("[useToast] Subscribed to toast changes")

    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
      console.log("[useToast] Unsubscribed from toast changes")
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }

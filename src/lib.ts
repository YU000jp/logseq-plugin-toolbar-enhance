import { BlockUUID } from "@logseq/libs/dist/LSPlugin.user"

export const removeProvideStyle = (className: string) => {
    const doc = parent.document.head.querySelector(
        `style[data-injected-style^="${className}"]`
    ) as HTMLStyleElement | null
    if (doc) doc.remove()
}
export const confirmDialog = async (message: string) => {
  //index.htmlに<dialog>を記述済み
  document.getElementById("message")!.innerText = message
  const dialogElement = document.getElementById("dialog") as HTMLDialogElement
  dialogElement.showModal()

  return new Promise(resolve => {
    const eventBase = flag => () => {
      dialogElement.close()
      document.getElementById("button-ok")!.removeEventListener("click", okEvent)
      document.getElementById("button-cancel")!.removeEventListener("click", cancelEvent)
      resolve(flag)
    }
    const okEvent = eventBase(true)
    const cancelEvent = eventBase(false)
    document.getElementById("button-ok")!.addEventListener("click", okEvent)
    document.getElementById("button-cancel")!.addEventListener("click", cancelEvent)
  })
}

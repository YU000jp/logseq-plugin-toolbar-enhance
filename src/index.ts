import '@logseq/libs' //https://plugins-doc.logseq.com/
import { PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { setup as l10nSetup, t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import { confirmDialog, removeProvideStyle } from './lib'
import { settingsTemplate } from './settings'
import af from "./translations/af.json"
import de from "./translations/de.json"
import es from "./translations/es.json"
import fr from "./translations/fr.json"
import id from "./translations/id.json"
import it from "./translations/it.json"
import ja from "./translations/ja.json"
import ko from "./translations/ko.json"
import nbNO from "./translations/nb-NO.json"
import nl from "./translations/nl.json"
import pl from "./translations/pl.json"
import ptBR from "./translations/pt-BR.json"
import ptPT from "./translations/pt-PT.json"
import ru from "./translations/ru.json"
import sk from "./translations/sk.json"
import tr from "./translations/tr.json"
import uk from "./translations/uk.json"
import zhCN from "./translations/zh-CN.json"
import zhHant from "./translations/zh-Hant.json"
const keyFavCss = "toolbarFavoriteCss"

const keyUndo = "buttonUndo"
const keyRedo = "buttonRedo"
const keyFavorite = "buttonFavorite"
const keyDeletePage = "buttonDeletePage"
const keyOpenFileInDefaultApp = "buttonOpenFileInDefaultApp"
const keyOpenFileInDirectory = "buttonOpenFileInDirectory"


/* main */
const main = async () => {

  //多言語化 L10N
  await l10nSetup({
    builtinTranslations: {//Full translations
      ja, af, de, es, fr, id, it, ko, "nb-NO": nbNO, nl, pl, "pt-BR": ptBR, "pt-PT": ptPT, ru, sk, tr, uk, "zh-CN": zhCN, "zh-Hant": zhHant
    }
  })

  /* user settings */
  logseq.useSettingsSchema(settingsTemplate())

  // First time setup
  // if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300)

  logseq.provideStyle({
    key: "main", style: `
    #${keyFavorite} {
        opacity: 0.2;
    }
    body:not([data-page="page"]){
      & #${keyFavorite},
      & #${keyDeletePage},
      & #${keyOpenFileInDefaultApp},
      & #${keyOpenFileInDirectory} {
          display: none;
      }
    }
    `})


  // Undo & Redo
  logseq.App.registerUIItem('toolbar', {
    key: "UndoAndRedo",
    template: `
    <div style="display: flex; justify-content: space-between;">
      <div title="${t("Undo")}"><button class="button icon" data-on-click="${keyUndo}" style="font-size: 16px">↩️</button></div>
      <div title="${t("Redo")}"><button class="button icon" data-on-click="${keyRedo}" style="font-size: 16px">↪️</button></div>
    </div>
    `,
  })

  // Delete Page & Favorite
  logseq.App.registerUIItem('toolbar', {
    key: "FavoriteAndDelete",
    template: `
    <div style="display: flex; justify-content: space-between;">
    <div title="${t("Favorite")}"><button class="button icon" id="${keyFavorite}" data-on-click="${keyFavorite}" style="font-size: 16px">⭐</button></div>
    <div title="${t("Delete page")}"><button class="button icon" id="${keyDeletePage}" data-on-click="${keyDeletePage}" style="font-size: 16px">🗑️</button></div>
    </div>
    `,
  })

  // Open File in Default App と Open File in Directory
  logseq.App.registerUIItem('toolbar', {
    key: "OpenFile",
    template: `
    <div style="display: flex; justify-content: space-between;">
    <div title="${t("Open file in default app")}"><button class="button icon" id="${keyOpenFileInDefaultApp}" data-on-click="${keyOpenFileInDefaultApp}" style="font-size: 16px">📱</button></div>
    <div title="${t("Open the directory (folder)")}"><button class="button icon" id="${keyOpenFileInDirectory}" data-on-click="${keyOpenFileInDirectory}" style="font-size: 16px">📁</button></div>
    </div>
    `,
  })


  // ルート変更時
  logseq.App.onRouteChanged(async ({ path, template }) => {

    // ページをチェックするたびに、以前のスタイルを削除する
    removeProvideStyle(keyFavCss)

    if (template !== "/page/:name") //ページ以外は除外
      return
    //console.log("onRouteChanged", path, template)

    // pathの値に「%2F」が含まれていたら「/」に変換する。先頭の/page/を削除する
    const pagePath = decodeURIComponent(path).replace(/^\/page\//, "")
    //console.log("pagePath", pagePath)

    if (pagePath)
      provideStyleForFavOnly(pagePath) // お気に入りに含まれている場合のみスタイルを適用
  })


  // 初回読み込み時
  setTimeout(() => {
    // ページであれば、お気に入りボタンにスタイルを適用

    // h1.page-title span.title[data-ref]の値にページ名が入っている
    const pagePath = (parent.document.querySelector("h1.page-title span.title[data-ref]") as HTMLElement)?.dataset.ref
    if (pagePath) {
      //console.log("pageTitle", pagePath) 小文字のみ
      provideStyleForFavOnly(pagePath)
    }
  }, 310)


  //クリックイベント
  logseq.provideModel({

    // logseq.editor/undo
    [keyUndo]: () => {
      logseq.UI.showMsg(t("Undo"), "info", { timeout: 2200 })
      logseq.App.invokeExternalCommand("logseq.editor/undo" as any)
    },

    // logseq.editor/redo
    [keyRedo]: () => {
      logseq.UI.showMsg(t("Redo"), "info", { timeout: 2200 })
      logseq.App.invokeExternalCommand("logseq.editor/redo" as any)
    },

    // Delete Page
    [keyDeletePage]: async () => {
      const currentPageEntity = await logseq.Editor.getCurrentPage() as { name: PageEntity["name"] } | null
      if (currentPageEntity) {
        //ユーザーに確認する
        logseq.showMainUI()
        if (await confirmDialog(t("Do you want to delete this page?"))) {
          logseq.UI.showMsg(t("The page has been removed."), "info", { timeout: 2200 })
          await logseq.Editor.deletePage(currentPageEntity.name)
        } else
          logseq.UI.showMsg(t("Canceled"), "warning", { timeout: 2200 })
        logseq.hideMainUI()
      } else {
        console.warn("getCurrentPagePath not found") // ページ名が取得できない場合
        //このページは削除できない
        logseq.UI.showMsg(t("This page cannot be deleted."), "warning", { timeout: 2200 })
      }
    },

    // logseq.command/toggle-favorite
    [keyFavorite]: async () => {
      const favoritesArray = await logseq.App.getCurrentGraphFavorites() as string[] | null
      if (favoritesArray) {
        //現在のページ名を取得
        const currentPageEntity = await logseq.Editor.getCurrentPage() as { name: PageEntity["name"] } | null
        if (currentPageEntity) {
          //favoritesArrayにページ名が含まれているかチェック
          if (favoritesArray.includes(currentPageEntity.name))
            //ページをお気に入りから削除
            logseq.UI.showMsg(t("Delete from the favorites list"), "info", { timeout: 2200 })
          else
            //ページをお気に入りに追加
            logseq.UI.showMsg(t("Add to the favorites list"), "success", { timeout: 2200 })

          logseq.App.invokeExternalCommand("logseq.command/toggle-favorite" as any)
        } else
          console.warn("getCurrentPagePath not found") // ページ名が取得できない場合
      } //else
      //console.warn("getCurrentGraphFavorites not found") // お気に入りが空の場合もある
    },

    // logseq.editor/open-file-in-default-app
    [keyOpenFileInDefaultApp]: () => {
      logseq.UI.showMsg(t("Open file in default app"), "info", { timeout: 2200 })
      logseq.App.invokeExternalCommand("logseq.editor/open-file-in-default-app" as any)
    },

    // logseq.editor/open-file-in-directory
    [keyOpenFileInDirectory]: () => {
      logseq.UI.showMsg(t("Open the directory (folder)"), "info", { timeout: 2200 })
      logseq.App.invokeExternalCommand("logseq.editor/open-file-in-directory" as any)
    },

  })

}/* end_main */



const provideStyleForFavOnly = (pagePath: string) => {
  logseq.provideStyle({
    key: keyFavCss, style: `
    body[data-page="page"]:has(li.favorite-item[title="${pagePath}"]) #${keyFavorite} {
        opacity: 1;
        font-size: small;
    }
    `})
}


logseq.ready(main).catch(console.error)
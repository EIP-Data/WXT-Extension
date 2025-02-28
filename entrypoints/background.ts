import i18n from "@/utils/i18n";

export default defineBackground(() => {
  console.log(browser.i18n.getMessage('extName'));
});

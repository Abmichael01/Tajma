import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  const locales = ['en', 'fr', 'ha'];
  if (!locale || !locales.includes(locale as any)) {
    locale = 'fr';
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});

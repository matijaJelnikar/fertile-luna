import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const provideI18n = () =>
  provideTranslateService({
    loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    fallbackLang: 'en',
    lang: 'en',
  });

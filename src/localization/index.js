import { I18n } from 'i18n-js';
import ru from './ru';
import en from './en';

const i18n = new I18n({ ru, en });

i18n.enableFallback = true;
i18n.defaultLocale = 'ru';
i18n.locale = 'ru';

export default i18n;

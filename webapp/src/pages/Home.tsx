// src/pages/Home.tsx
import MyComponent from "@/components/MyComponent";
import { useTranslation } from 'react-i18next';

const Home = () => {

    const { t, i18n } = useTranslation();

    return (
        <div>
            <h2>Home Page</h2>
            <MyComponent />
            <div>
                <h1>{t('welcome')}</h1>
                <button onClick={() => i18n.changeLanguage('es')}>ES</button>
                <button onClick={() => i18n.changeLanguage('en')}>EN</button>
            </div>
        </div>
    );
};

export default Home;

import { Suspense, lazy } from 'react';

// Lazy loading для тяжелого компонента
const HeavyComponent = lazy(() => import('../components/HeavyComponent'));
const About = () => {
  return (
    <div className="page">
      <h1>О нас</h1>
      <p>Пример ленивой загрузки тяжелого компонента.</p>
      <Suspense fallback={<div>Загрузка...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
};

export default About;
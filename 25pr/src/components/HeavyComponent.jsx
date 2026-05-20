import { useState, useEffect } from 'react';

const HeavyComponent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const generateData = () => {
      const items = [];
      for (let i = 1; i < 10000; i++) {
        items.push({
          id: i,
          title: `Элемент ${i}`,
          value: Math.round(Math.random() * 1000)
        });
      }
      setData(items);
    };

    const timer = setTimeout(generateData, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="heavy-component">
      <h2>Тяжелый компонент</h2>
      <p>Этот компонент загружается лениво и содержит {data.length} элементов.</p>
      <div className="data-preview">
        <h3>Предпросмотр данных:</h3>
        <ul>
          {data.slice(0, 5).map(item => (
            <li key={item.id}>
              <strong>{item.title}</strong>: {item.value}
            </li>
          ))}
        </ul>
        <p>... и еще {data.length - 5} элементов</p>
      </div>
    </div>
  );
};

export default HeavyComponent;
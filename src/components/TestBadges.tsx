import React from 'react';
import ProductCardBadges from './ProductCard/ProductCardBadges';

const TestBadges = () => {
  // منتجات اختبارية بحالات مختلفة
  const testProducts = [
    {
      id: '1',
      name: 'منتج بخصم رقم 15',
      discount: 15,
      created_at: new Date().toISOString(),
      inStock: true
    },
    {
      id: '2',
      name: 'منتج بخصم نص "20"',
      discount: "20", // نص
      created_at: new Date().toISOString(),
      inStock: true
    },
    {
      id: '3',
      name: 'منتج بخصم 0',
      discount: 0,
      created_at: new Date().toISOString(),
      inStock: true
    },
    {
      id: '4',
      name: 'منتج بخصم null',
      discount: null,
      created_at: new Date().toISOString(),
      inStock: true
    },
    {
      id: '5',
      name: 'منتج بدون خصم',
      created_at: new Date().toISOString(),
      inStock: true
    },
    {
      id: '6',
      name: 'منتج قديم بخصم',
      discount: 25,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      inStock: true
    },
    {
      id: '7',
      name: 'منتج بخصم "abc" (نص غير صحيح)',
      discount: "abc",
      created_at: new Date().toISOString(),
      inStock: true
    }
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">اختبار البادجز</h1>
      
      {testProducts.map((product) => (
        <div key={product.id} className="border p-4 rounded-lg bg-white shadow">
          <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-4">
            خصم: {JSON.stringify(product.discount)} | 
            إنشاء: {new Date(product.created_at).toLocaleDateString('ar')}
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">بادجز على الصورة (onImage):</h4>
              <div className="relative inline-block bg-gray-200 p-4 rounded">
                <ProductCardBadges product={product} variant="onImage" />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">بادجز تحت الاسم (belowName):</h4>
              <ProductCardBadges product={product} variant="belowName" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TestBadges;

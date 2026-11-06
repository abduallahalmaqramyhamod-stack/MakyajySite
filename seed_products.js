const { getDb } = require('./init');

function seedDemoProducts() {
  const db = getDb();
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count > 0) {
    console.log('Products already exist. Skipping seed.');
    return;
  }

  const categories = db.prepare('SELECT id, name FROM categories').all();
  const brands = db.prepare('SELECT id, name FROM brands').all();

  const catMap = {};
  categories.forEach((c) => { catMap[c.name] = c.id; });

  const brandMap = {};
  brands.forEach((b) => { brandMap[b.name] = b.id; });

  const sampleProducts = [
    {
      name: 'أحمر شفاه كلاسيكي فيلفيت مات',
      slug: 'classic-velvet-matte-lipstick',
      short_description: 'أحمر شفاه مخملي ثابت يدوم طوال اليوم مع ترطيب فائق',
      description: 'تركيبة فاخرة ومريحة تنساب بسلاسة وتمنح شفتيك لوناً غنياً ولمسة نهائية مخملية غير لامعة تدوم حتى 12 ساعة بدون جفاف.',
      sku: 'MKP-LIP-001',
      price: 6500,
      compare_price: 8500,
      cost_price: 4500,
      category_id: catMap['مكياج الشفاه'] || categories[0]?.id,
      brand_id: brandMap['ماك'] || brands[0]?.id,
      stock_quantity: 45,
      is_featured: 1,
      is_new: 1,
      image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80',
    },
    {
      name: 'كريم أساس سائل فوتوفوكس تغطية كاملة',
      slug: 'liquid-foundation-photofocus',
      short_description: 'كريم أساس يدوم 24 ساعة يمنح بشرتك مظهراً طبيعياً خالياً من العيوب',
      description: 'كريم أساس خفيف الوزن يوفر تغطية كاملة تخفي المسام والخطوط الدقيقة مع مقاومة للحرارة والرطوبة، مثالي للبشرة في المناخ الحار.',
      sku: 'MKP-FND-002',
      price: 12500,
      compare_price: 15000,
      cost_price: 9000,
      category_id: catMap['مكياج الوجه'] || categories[0]?.id,
      brand_id: brandMap['لوريال'] || brands[0]?.id,
      stock_quantity: 28,
      is_featured: 1,
      is_new: 1,
      image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&q=80',
    },
    {
      name: 'باليت ظلال العيون روز جولد 18 لون',
      slug: 'eyeshadow-palette-rose-gold',
      short_description: 'تشكيلة ظلال عيون متألقة بين اللمعان الماسي والمات الناعم',
      description: 'باليت ظلال عيون متكاملة تضم 18 لوناً غنياً بين درجات الوردي، النحاسي، والذهبي اللامع، سهلة الدمج وتمنحك إطلالات ساحرة ليلاً ونهاراً.',
      sku: 'MKP-EYE-003',
      price: 18000,
      compare_price: 22000,
      cost_price: 13000,
      category_id: catMap['مكياج العيون'] || categories[0]?.id,
      brand_id: brandMap['ماك'] || brands[0]?.id,
      stock_quantity: 15,
      is_featured: 1,
      is_new: 0,
      image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
    },
    {
      name: 'ماسكارا سكاي هاي تكثيف وتطويل فائق',
      slug: 'sky-high-lash-mascara',
      short_description: 'رموش طويلة وكثيفة كالمروحة بلمسة واحدة دون تكتل',
      description: 'فرشاة مرنة حصرية مع تركيبة مدعمة بخلاصة الخيزران وألياف متطورة تمنح الرموش حجماً مضاعفاً وطولاً لا يقاوم طوال 24 ساعة.',
      sku: 'MKP-EYE-004',
      price: 5500,
      compare_price: 7000,
      cost_price: 3800,
      category_id: catMap['مكياج العيون'] || categories[0]?.id,
      brand_id: brandMap['مايبيلين'] || brands[0]?.id,
      stock_quantity: 60,
      is_featured: 1,
      is_new: 1,
      image: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?w=800&q=80',
    },
    {
      name: 'سيروم حمض الهيالورونيك وفيتامين سي',
      slug: 'hyaluronic-acid-vit-c-serum',
      short_description: 'سيروم نضارة مركز لترطيب عميق وتفتيح فوري',
      description: 'تركيبة مكثفة تغذي خلايا البشرة وتعيد إليها النضارة والإشراق وتحميها من علامات التقدم في السن والإجهاد اليومي.',
      sku: 'MKP-SKN-005',
      price: 9800,
      compare_price: 13000,
      cost_price: 6500,
      category_id: catMap['العناية بالبشرة'] || categories[0]?.id,
      brand_id: brandMap['لوريال'] || brands[0]?.id,
      stock_quantity: 35,
      is_featured: 1,
      is_new: 1,
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
    },
    {
      name: 'عطر بلاك أوبيوم الفاخر 90 مل',
      slug: 'black-opium-luxury-perfume',
      short_description: 'عطر أنثوي شرقي غامض وجذاب بنفحات القهوة والفانيليا',
      description: 'عطر ساحر يجمع بين طاقة القهوة السوداء الزكية وأنوثة الأزهار البيضاء مع لمسة دافئة ومغرية من الفانيليا وخشب الأرز.',
      sku: 'MKP-PRF-006',
      price: 45000,
      compare_price: 52000,
      cost_price: 36000,
      category_id: catMap['العطور'] || categories[0]?.id,
      brand_id: brandMap['إيف سان لوران'] || brands[0]?.id,
      stock_quantity: 12,
      is_featured: 1,
      is_new: 0,
      image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&q=80',
    },
    {
      name: 'زيت الأرغان المغربي لإصلاح الشعر التالف',
      slug: 'moroccan-argan-hair-oil',
      short_description: 'علاج مغذٍ يعيد الحيوية واللمعان والنعومة للشعر الجاف والمتقصف',
      description: 'زيت شعر غني بمضادات الأكسدة وفيتامين E، يمتص بسرعة ليغذي الخصلات ويحميها من حرارة الاستشوار وأشعة الشمس.',
      sku: 'MKP-HAR-007',
      price: 7500,
      compare_price: 9500,
      cost_price: 5000,
      category_id: catMap['العناية بالشعر'] || categories[0]?.id,
      brand_id: brandMap['لوريال'] || brands[0]?.id,
      stock_quantity: 40,
      is_featured: 0,
      is_new: 1,
      image: 'https://images.unsplash.com/photo-1608248597359-00994f31c260?w=800&q=80',
    },
    {
      name: 'طقم فرش مكياج احترافي 12 قطعة مع حقيبة مخملية',
      slug: 'professional-makeup-brush-set',
      short_description: 'شعر فائق النعومة لتوزيع متجانس واحترافي لجميع أنواع المكياج',
      description: 'مجموعة متكاملة تضم فرش الوجه والعيون والشفايف، مصنوعة من ألياف صناعية ناعمة مضادة للبكتيريا ومقبض خشبي مريح وفاخر.',
      sku: 'MKP-ACC-008',
      price: 8000,
      compare_price: 11000,
      cost_price: 5500,
      category_id: catMap['إكسسوارات'] || categories[0]?.id,
      brand_id: brandMap['ماك'] || brands[0]?.id,
      stock_quantity: 22,
      is_featured: 1,
      is_new: 0,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    },
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (
      name, slug, short_description, description, sku, price, compare_price, cost_price,
      currency, category_id, brand_id, stock_quantity, low_stock_threshold,
      is_active, is_featured, is_new
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'YER', ?, ?, ?, 5, 1, ?, ?)
  `);

  const insertImg = db.prepare(`
    INSERT INTO product_images (product_id, image_path, thumbnail_path, alt_text, is_primary)
    VALUES (?, ?, ?, ?, 1)
  `);

  for (const p of sampleProducts) {
    const res = insertProd.run(
      p.name, p.slug, p.short_description, p.description, p.sku,
      p.price, p.compare_price, p.cost_price, p.category_id, p.brand_id,
      p.stock_quantity, p.is_featured, p.is_new
    );

    insertImg.run(res.lastInsertRowid, p.image, p.image, p.name);
  }

  // Seed sample banners if none exist
  const bannerCount = db.prepare('SELECT COUNT(*) as count FROM banners').get();
  if (bannerCount.count === 0) {
    const insertBanner = db.prepare(`
      INSERT INTO banners (title, subtitle, image, link, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    insertBanner.run(
      'تألقي بجمال استثنائي',
      'أحدث تشكيلات المكياج والعطور العالمية الأصلية بأسعار خاصة وحصرية',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600&q=80',
      '/products',
      1
    );

    insertBanner.run(
      'عروض ربيع الجمال',
      'خصومات تصل حتى 40% على أرقى منتجات العناية بالبشرة',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1600&q=80',
      '/products?on_sale=1',
      2
    );
  }

  console.log(`🌸 Seeded ${sampleProducts.length} demo products and banners successfully.`);
}

module.exports = { seedDemoProducts };

if (require.main === module) {
  seedDemoProducts();
}

import bcrypt from 'bcryptjs';
import {prisma} from '../config/prisma.js';
import {AppError,asyncHandler,created,ok} from '../utils/response.js';
import {orderDto,productDto} from '../utils/order.js';
export const uploadProductImage=asyncHandler(async(req,res)=>{if(!req.file)throw new AppError('Choose an image to upload',422);created(res,{url:`${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`},'Product image uploaded')});
export const uploadBannerImage=asyncHandler(async(req,res)=>{if(!req.file)throw new AppError('Choose an image to upload',422);created(res,{url:`${req.protocol}://${req.get('host')}/uploads/banners/${req.file.filename}`},'Banner image uploaded')});
export const dashboard=asyncHandler(async(req,res)=>{const today=new Date();today.setHours(0,0,0,0);const [todayOrders,pending,totalOrders,totalCustomers,totalProducts,lowStock,outOfStock,revenue,recentOrders,recentCustomers,topProducts]=await Promise.all([prisma.order.count({where:{createdAt:{gte:today}}}),prisma.order.count({where:{status:{in:['NEW','CONFIRMED','PACKING']}}}),prisma.order.count(),prisma.user.count({where:{role:'CUSTOMER'}}),prisma.product.count({where:{deletedAt:null}}),prisma.product.count({where:{stock:{gt:0,lte:10},deletedAt:null}}),prisma.product.count({where:{stock:0,deletedAt:null}}),prisma.order.aggregate({_sum:{grandTotal:true},where:{status:'DELIVERED'}}),prisma.order.findMany({take:8,orderBy:{createdAt:'desc'},include:{items:true,user:true}}),prisma.user.findMany({where:{role:'CUSTOMER'},take:6,orderBy:{createdAt:'desc'}}),prisma.orderItem.groupBy({by:['productId','name'],_sum:{quantity:true},orderBy:{_sum:{quantity:'desc'}},take:5})]);ok(res,{stats:{todayOrders,pending,totalOrders,totalCustomers,totalProducts,lowStock,outOfStock,totalRevenue:Number(revenue._sum.grandTotal||0)},recentOrders:recentOrders.map(orderDto),recentCustomers,topProducts})});
const productData=body=>{
 const status=String(body.status||'ACTIVE').trim().toUpperCase();
 if(!['ACTIVE','INACTIVE'].includes(status))throw new AppError('Invalid product status',422);
 return {name:String(body.name||'').trim(),description:String(body.description||'').trim(),unit:String(body.unit||'').trim(),sku:String(body.sku||'').trim().toUpperCase(),mrp:Number(body.mrp),price:Number(body.price),stock:Number(body.stock),status,featured:Boolean(body.featured),bestSeller:Boolean(body.bestSeller)};
};
const productInclude={category:true,images:{orderBy:{position:'asc'}}};
async function uniqueProductSlug(name){const base=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||`product-${Date.now()}`;let slug=base,index=2;while(await prisma.product.findUnique({where:{slug},select:{id:true}}))slug=`${base}-${index++}`;return slug}
export const products={
 create:asyncHandler(async(req,res)=>{const {category,image}=req.body;const data=productData(req.body);const cat=await prisma.category.findUnique({where:{slug:category}});if(!cat)throw new AppError('Category not found',404);if(!data.name||!data.description||!data.unit||!data.sku)throw new AppError('Complete all required product fields',422);if(await prisma.product.findUnique({where:{sku:data.sku},select:{id:true}}))throw new AppError('A product with this SKU already exists. Enter a unique SKU.',409);const slug=await uniqueProductSlug(data.name);created(res,productDto(await prisma.product.create({data:{...data,id:req.body.id||`p${Date.now()}`,slug,categoryId:cat.id,images:image?{create:{url:String(image).trim()}}:undefined},include:productInclude}))) }),
 update:asyncHandler(async(req,res)=>{const {category,image}=req.body;const data=productData(req.body);const cat=await prisma.category.findUnique({where:{slug:category}});if(!cat)throw new AppError('Category not found',404);if(!data.name||!data.description||!data.unit||!data.sku)throw new AppError('Complete all required product fields',422);const imageUrl=String(image||'').trim();ok(res,productDto(await prisma.product.update({where:{id:req.params.id},data:{...data,categoryId:cat.id,...(imageUrl&&{images:{deleteMany:{},create:{url:imageUrl}}})},include:productInclude})),'Product updated')}),
 status:asyncHandler(async(req,res)=>{const status=String(req.body.status||'').trim().toUpperCase();if(!['ACTIVE','INACTIVE'].includes(status))throw new AppError('Status must be ACTIVE or INACTIVE',422);const product=await prisma.product.findUnique({where:{id:req.params.id},select:{id:true}});if(!product)throw new AppError('Product not found',404);ok(res,productDto(await prisma.product.update({where:{id:req.params.id},data:{status},include:productInclude})),status==='ACTIVE'?'Product activated':'Product deactivated')}),
 remove:asyncHandler(async(req,res)=>{await prisma.product.update({where:{id:req.params.id},data:{deletedAt:new Date(),status:'INACTIVE'}});ok(res,null,'Product deleted')}),
 stock:asyncHandler(async(req,res)=>ok(res,await prisma.product.update({where:{id:req.params.id},data:{stock:Number(req.body.stock),lowStockThreshold:Number(req.body.lowStockThreshold??10)}}),'Stock updated'))
};
const categoryData=body=>{
 const name=String(body.name||'').trim();
 if(!name)throw new AppError('Category name is required',422);
 const slug=String(body.slug||name).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 if(!slug)throw new AppError('Please enter a valid category name',422);
 const status=String(body.status||'ACTIVE').toUpperCase();
 if(!['ACTIVE','INACTIVE'].includes(status))throw new AppError('Invalid category status',422);
 return {name,slug,image:String(body.image||'').trim()||null,color:String(body.color||'').trim()||'#EAF8E8',position:Number(body.position||0),status,parentId:body.parentId||null};
};
const categoryInclude={parent:{select:{id:true,name:true}},children:{select:{id:true,name:true,status:true},orderBy:{position:'asc'}},_count:{select:{products:true}}};
export const categories={
 list:asyncHandler(async(req,res)=>ok(res,await prisma.category.findMany({include:categoryInclude,orderBy:[{position:'asc'},{name:'asc'}]}))),
 create:asyncHandler(async(req,res)=>created(res,await prisma.category.create({data:categoryData(req.body),include:categoryInclude}),'Category created')),
 update:asyncHandler(async(req,res)=>{
  if(req.body.parentId===req.params.id)throw new AppError('A category cannot be its own parent',422);
  ok(res,await prisma.category.update({where:{id:req.params.id},data:categoryData(req.body),include:categoryInclude}),'Category updated');
 }),
 remove:asyncHandler(async(req,res)=>{
  const category=await prisma.category.findUnique({where:{id:req.params.id},include:{_count:{select:{products:true,children:true}}}});
  if(!category)throw new AppError('Category not found',404);
  if(category._count.products||category._count.children)throw new AppError('Remove this category’s products and subcategories before deleting it.',409);
  await prisma.category.delete({where:{id:req.params.id}});
  ok(res,null,'Category deleted');
 })
};
export const orders={list:asyncHandler(async(req,res)=>{const rows=await prisma.order.findMany({where:req.query.status?{status:req.query.status}:{},include:{user:true,items:true},orderBy:{createdAt:'desc'}});ok(res,rows.map(orderDto))}),get:asyncHandler(async(req,res)=>{const row=await prisma.order.findFirst({where:{OR:[{id:req.params.id},{orderNumber:req.params.id}]},include:{user:true,items:true,history:true,payment:true,coupon:true}});if(!row)throw new AppError('Order not found',404);ok(res,orderDto(row))}),status:asyncHandler(async(req,res)=>{const status=String(req.body.status).trim().toUpperCase().replaceAll(' ','_');const allowed=['NEW','CONFIRMED','PACKING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];if(!allowed.includes(status))throw new AppError('Invalid order status',422);const row=await prisma.$transaction(async tx=>{const order=await tx.order.update({where:{id:req.params.id},data:{status}});await tx.orderStatusHistory.create({data:{orderId:order.id,status,note:req.body.note}});return order});ok(res,orderDto(row),'Order status updated')})};
export const customers=asyncHandler(async(req,res)=>{
 const where={role:'CUSTOMER'};
 if(req.query.q)where.OR=[{name:{contains:req.query.q}},{email:{contains:req.query.q}}];
 const rows=await prisma.user.findMany({where,include:{addresses:true,orders:{select:{id:true,grandTotal:true,status:true,createdAt:true}}},orderBy:{createdAt:'desc'}});
 ok(res,rows.map(user=>({...user,passwordHash:undefined,totalOrders:user.orders.length,totalSpent:user.orders.reduce((sum,order)=>sum+Number(order.grandTotal),0)})));
});
const couponData=body=>({code:String(body.code).trim().toUpperCase(),type:String(body.type).toUpperCase(),discount:Number(body.discount),minimumOrder:Number(body.minimumOrder),maximumDiscount:body.maximumDiscount===''||body.maximumDiscount==null?null:Number(body.maximumDiscount),usageLimit:body.usageLimit===''||body.usageLimit==null?null:Number(body.usageLimit),perUserLimit:Number(body.perUserLimit||1),startsAt:new Date(body.startsAt),expiresAt:new Date(body.expiresAt),status:String(body.status||'ACTIVE').toUpperCase()});
export const coupons={
 list:asyncHandler(async(req,res)=>ok(res,await prisma.coupon.findMany({orderBy:{createdAt:'desc'}}))),
 create:asyncHandler(async(req,res)=>created(res,await prisma.coupon.create({data:couponData(req.body)}),'Coupon created')),
 update:asyncHandler(async(req,res)=>ok(res,await prisma.coupon.update({where:{id:req.params.id},data:couponData(req.body)}),'Coupon updated')),
 status:asyncHandler(async(req,res)=>{const status=String(req.body.status||'').toUpperCase();if(!['ACTIVE','INACTIVE'].includes(status))throw new AppError('Status must be ACTIVE or INACTIVE',422);ok(res,await prisma.coupon.update({where:{id:req.params.id},data:{status}}),status==='ACTIVE'?'Coupon activated':'Coupon deactivated')}),
 remove:asyncHandler(async(req,res)=>{const coupon=await prisma.coupon.findUnique({where:{id:req.params.id},select:{id:true}});if(!coupon)throw new AppError('Coupon not found',404);await prisma.$transaction([prisma.couponUsage.deleteMany({where:{couponId:req.params.id}}),prisma.order.updateMany({where:{couponId:req.params.id},data:{couponId:null}}),prisma.coupon.delete({where:{id:req.params.id}})]);ok(res,null,'Coupon permanently deleted')})
};
const bannerData=body=>{
 const heading=String(body.heading||'').trim();
 if(!heading)throw new AppError('Banner heading is required',422);
 const status=String(body.status||'ACTIVE').trim().toUpperCase();
 if(!['ACTIVE','INACTIVE'].includes(status))throw new AppError('Status must be ACTIVE or INACTIVE',422);
 return {kicker:String(body.kicker||'').trim()||null,heading,subtitle:String(body.subtitle||'').trim()||null,image:String(body.image||'').trim()||null,ctaText:String(body.ctaText||'Shop now').trim()||'Shop now',destination:String(body.destination||'/').trim()||'/',position:Math.max(0,Number(body.position)||0),status};
};
export const banners={
 list:asyncHandler(async(req,res)=>ok(res,await prisma.banner.findMany({orderBy:[{position:'asc'},{createdAt:'desc'}]}))),
 create:asyncHandler(async(req,res)=>created(res,await prisma.banner.create({data:bannerData(req.body)}),'Banner created')),
 update:asyncHandler(async(req,res)=>ok(res,await prisma.banner.update({where:{id:req.params.id},data:bannerData(req.body)}),'Banner updated')),
 status:asyncHandler(async(req,res)=>{const status=String(req.body.status||'').toUpperCase();if(!['ACTIVE','INACTIVE'].includes(status))throw new AppError('Status must be ACTIVE or INACTIVE',422);ok(res,await prisma.banner.update({where:{id:req.params.id},data:{status}}),status==='ACTIVE'?'Banner activated':'Banner deactivated')}),
 remove:asyncHandler(async(req,res)=>{await prisma.banner.delete({where:{id:req.params.id}});ok(res,null,'Banner permanently deleted')})
};
export const inventory=asyncHandler(async(req,res)=>{
 const rows=await prisma.product.findMany({where:{deletedAt:null},include:{category:true,images:{take:1}},orderBy:{stock:'asc'}});
 const data=rows.map(product=>({...productDto(product),stockStatus:product.stock===0?'OUT_OF_STOCK':product.stock<=product.lowStockThreshold?'LOW_STOCK':'IN_STOCK'}));
 ok(res,data);
});
export const delivery={list:asyncHandler(async(req,res)=>ok(res,await prisma.deliveryArea.findMany())),save:asyncHandler(async(req,res)=>ok(res,await prisma.deliveryArea.upsert({where:{id:req.body.id||''},update:req.body,create:req.body}),'Delivery settings saved'))};
export const support={list:asyncHandler(async(req,res)=>ok(res,await prisma.supportTicket.findMany({include:{user:{select:{id:true,name:true,email:true,mobile:true}},messages:{orderBy:{createdAt:'asc'}}},orderBy:{createdAt:'desc'}}))),reply:asyncHandler(async(req,res)=>{const status=req.body.status?String(req.body.status).toUpperCase():undefined;if(status&&!['OPEN','PENDING','RESOLVED'].includes(status))throw new AppError('Invalid ticket status',422);const message=String(req.body.message||'').trim();const ticket=await prisma.supportTicket.update({where:{id:req.params.id},data:{status,messages:message?{create:{message,isAdmin:true,senderId:req.user.id}}:undefined},include:{messages:true}});ok(res,ticket,'Ticket updated')})};
export const settings={
 get:asyncHandler(async(req,res)=>ok(res,await prisma.storeSetting.findUnique({where:{id:1}}))),
 save:asyncHandler(async(req,res)=>ok(res,await prisma.storeSetting.upsert({where:{id:1},update:req.body,create:{id:1,...req.body}}),'Settings saved'))
};

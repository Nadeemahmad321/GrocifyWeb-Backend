import {Router} from 'express';
import * as a from '../controllers/admin.controller.js';
import {authenticate,authorize} from '../middleware/auth.js';
import {bannerImageUpload,productImageUpload} from '../middleware/upload.js';

export const adminRouter=Router();
adminRouter.use(authenticate,authorize('ADMIN','MANAGER'));
adminRouter.post('/uploads/products',productImageUpload.single('image'),a.uploadProductImage);
adminRouter.post('/uploads/banners',bannerImageUpload.single('image'),a.uploadBannerImage);
adminRouter.get('/dashboard',a.dashboard);
adminRouter.post('/products',a.products.create);
adminRouter.patch('/products/:id/status',a.products.status);
adminRouter.patch('/products/:id',a.products.update);
adminRouter.delete('/products/:id',a.products.remove);
adminRouter.patch('/inventory/:id',a.products.stock);
adminRouter.get('/inventory',a.inventory);
adminRouter.get('/categories',a.categories.list);
adminRouter.post('/categories',a.categories.create);
adminRouter.patch('/categories/:id',a.categories.update);
adminRouter.delete('/categories/:id',a.categories.remove);
adminRouter.get('/orders',a.orders.list);
adminRouter.get('/orders/:id',a.orders.get);
adminRouter.patch('/orders/:id/status',a.orders.status);
adminRouter.get('/customers',a.customers);
for(const [path,handler] of [['coupons',a.coupons],['banners',a.banners]]){
 adminRouter.get(`/${path}`,handler.list);
 adminRouter.post(`/${path}`,handler.create);
 adminRouter.patch(`/${path}/:id`,handler.update);
 adminRouter.delete(`/${path}/:id`,handler.remove);
}
adminRouter.patch('/coupons/:id/status',a.coupons.status);
adminRouter.patch('/banners/:id/status',a.banners.status);
adminRouter.get('/delivery',a.delivery.list);
adminRouter.put('/delivery',a.delivery.save);
adminRouter.get('/support',a.support.list);
adminRouter.patch('/support/:id',a.support.reply);
adminRouter.get('/settings',a.settings.get);
adminRouter.put('/settings',a.settings.save);

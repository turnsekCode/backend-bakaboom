import express from 'express';
import {
  addCategory,
  listCategories,
  listCategoriesTree,
  removeCategory,
  singleCategory,
  updateCategory,
  getBreadcrumbs
} from '../controllers/categoryController.js';

import authUser from '../middleware/auth.js';

const categoryRouter = express.Router();

/* =========================================
   ➕ CREATE (raíz o subcategoría)
========================================= */
categoryRouter.post('/add', authUser, addCategory);

/* =========================================
   📄 LIST (flat)
========================================= */
categoryRouter.get('/list', listCategories);

/* =========================================
   🌳 LIST (tree)
========================================= */
categoryRouter.get('/tree', listCategoriesTree);

/* =========================================
   🔍 SINGLE
========================================= */
categoryRouter.get('/single/:id', singleCategory);

/* =========================================
   ✏️ UPDATE
========================================= */
categoryRouter.put('/update/:id', authUser, updateCategory);

/* =========================================
   ❌ DELETE (con hijos)
========================================= */
categoryRouter.delete('/remove/:id', authUser, removeCategory);

/* =========================================
   📍 BREADCRUMBS
========================================= */
categoryRouter.get('/breadcrumbs/:id', getBreadcrumbs);

export default categoryRouter;
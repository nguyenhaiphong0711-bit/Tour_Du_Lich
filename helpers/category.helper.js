const Category = require("../models/category.model");

const buildCategoryTree = (categories, parentId = "", visited = new Set()) => {
  const tree = [];
  for (const item of categories) {
    if((item.parent || "") === parentId && !visited.has(item.id)) {
      const nextVisited = new Set(visited).add(item.id);
      tree.push({ id: item.id, name: item.name, slug: item.slug,
        children: buildCategoryTree(categories, item.id, nextVisited) });
    }
  }
  return tree;
};
module.exports.buildCategoryTree = buildCategoryTree;

const getCategoryChild = async (parentId, visited = new Set()) => {
  if(!parentId || visited.has(String(parentId))) return [];
  visited.add(String(parentId));
  const childList = await Category.find({ parent: parentId, deleted: false, status: "active" }).sort({ position: -1, _id: 1 });
  const result = [];
  for (const item of childList) {
    if(visited.has(item.id)) continue;
    result.push({ id: item.id, name: item.name });
    result.push(...await getCategoryChild(item.id, visited));
  }
  return result;
};
module.exports.getCategoryChild = getCategoryChild;

const getCategoryParent = async (parentId, visited = new Set()) => {
  if(!parentId || visited.has(String(parentId))) return [];
  visited.add(String(parentId));
  const item = await Category.findOne({ _id: parentId, deleted: false, status: "active" });
  if(!item) return [];
  const parents = await getCategoryParent(item.parent, visited);
  return [...parents, { id: item.id, name: item.name, avatar: item.avatar, slug: item.slug }];
};
module.exports.getCategoryParent = getCategoryParent;

module.exports.validateParent = async (id, parent) => {
  const visited = new Set(id ? [String(id)] : []);
  while(parent) {
    if(visited.has(String(parent))) throw new Error("Danh mục cha không được là chính nó hoặc danh mục con.");
    visited.add(String(parent));
    const item = await Category.findOne({ _id: parent, deleted: false });
    if(!item) throw new Error("Danh mục cha không tồn tại.");
    parent = item.parent;
  }
};

module.exports.visibleIds = async () => {
  const categories = await Category.find({ deleted: false, status: "active" }).sort({ position: -1, _id: 1 });
  const tree = buildCategoryTree(categories);
  const ids = [];
  const visit = list => list.forEach(item => { ids.push(item.id); visit(item.children); });
  visit(tree);
  return ids;
};

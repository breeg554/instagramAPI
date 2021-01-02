const loadCollection = function (colName, db) {
  console.log("aa");
  return new Promise((resolve) => {
    db.loadDatabase({}, () => {
      const _collection =
        db.getCollection(colName) || db.addCollection(colName);
      resolve(_collection);
    });
  });
};

module.exports.loadCollection = loadCollection;

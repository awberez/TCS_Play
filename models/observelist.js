module.exports = function(sequelize, DataTypes) {
  let ObserveList = sequelize.define("ObserveList", {
    id: {type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey:true
    },
    match_id: {type: DataTypes.INTEGER,
        allowNull: false,
    },
    observer_id: {type: DataTypes.INTEGER,
        allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    
  });
  return ObserveList;
};
module.exports = function(sequelize, DataTypes) {
  let NameList = sequelize.define("NameList", {
    id: {type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey:true
    },
    user_id: {type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    user_name: {type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    
  });
  return NameList;
};
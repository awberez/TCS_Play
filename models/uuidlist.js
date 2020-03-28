module.exports = function(sequelize, DataTypes) {
  let UuidList = sequelize.define("UuidList", {
    id: {type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey:true
    },
    uuid: {type: DataTypes.STRING,
        allowedNull: false,
        unique: true
    },
    match_id: {type: DataTypes.STRING,
        allowNull: false,
    },
    user_id: {type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });
  return UuidList;
};
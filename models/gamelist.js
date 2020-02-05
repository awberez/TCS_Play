module.exports = function(sequelize, DataTypes) {
  let GameList = sequelize.define("GameList", {
    id: {type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey:true
    },
    match_id: {type: DataTypes.INTEGER,
        allowNull: false,
    },
    black_id: {type: DataTypes.INTEGER,
        allowNull: false,
    },
    white_id: {type: DataTypes.INTEGER,
        allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    
  });
  return GameList;
};
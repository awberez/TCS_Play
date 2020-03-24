module.exports = function(sequelize, DataTypes) {
  let GameChat = sequelize.define("GameChat", {
    id: {type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey:true
    },
    match_id: {type: DataTypes.INTEGER,
        allowNull: false,
    },
    player_id: {type: DataTypes.INTEGER,
        allowNull: false,
    },
    player_message: {type: DataTypes.STRING,
        allowNull: false,
    },
    fen: {type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    
  });
  return GameChat;
};
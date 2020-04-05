module.exports = function(sequelize, DataTypes) {
  let GameList = sequelize.define("GameList", {
    id: {type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey:true
    },
    match_id: {type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    white_id: {type: DataTypes.STRING,
        allowNull: false,
    },
    black_id: {type: DataTypes.STRING,
        allowNull: false,
    },
    game_status: {type: DataTypes.STRING,
        defaultValue: "in progress",
        allowNull: false,
    },
    logo: {type: DataTypes.STRING,
        allowNull: true
    }, 
    header: {type: DataTypes.STRING,
        allowNull: true
    }, 
    callback_url: {type: DataTypes.STRING,
        allowNull: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    
  });
  return GameList;
};
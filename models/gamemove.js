module.exports = function(sequelize, DataTypes) {
  let GameMove = sequelize.define("GameMove", {
    id: {type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey:true
    },
    match_id: {type: DataTypes.INTEGER,
        allowNull: false,
    },
    from: {type: DataTypes.STRING,
        allowNull: false
    },
    to: {type: DataTypes.STRING,
        allowNull: false
    },
    promotion: {type: DataTypes.STRING,
        allowNull: false
    },
    fen: {type: DataTypes.STRING,
        allowNull: false
    },
    lastMove: {type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,  
  });
  return GameMove;
};
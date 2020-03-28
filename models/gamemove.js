module.exports = function(sequelize, DataTypes) {
  let GameMove = sequelize.define("GameMove", {
    id: {type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey:true
    },
    match_id: {type: DataTypes.STRING,
        allowNull: false,
    },
    from: {type: DataTypes.STRING,
        allowNull: true
    },
    to: {type: DataTypes.STRING,
        allowNull: true
    },
    promotion: {type: DataTypes.STRING,
        allowNull: true
    },
    fen: {type: DataTypes.STRING,
        allowNull: false
    },
    lastMove: {type: DataTypes.STRING,
        allowNull: false
    },
    resign_id: {type: DataTypes.STRING,
        allowNull: true
    },
    coach_comment: {type: DataTypes.STRING,
        allowNull: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,  
  });
  return GameMove;
};
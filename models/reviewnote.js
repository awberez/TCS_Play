module.exports = function(sequelize, DataTypes) {
  let ReviewNote = sequelize.define("ReviewNote", {
    id: {type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey:true
    },
    match_id: {type: DataTypes.STRING,
        allowNull: false,
    },
    user_name: {type: DataTypes.STRING,
        allowNull: false,
    },
    user_message: {type: DataTypes.STRING,
        allowNull: false,
    },
    fen: {type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });
  return ReviewNote;
};
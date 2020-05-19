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
    move_id: {type: DataTypes.INTEGER,
        allowNull: false,
    },
    move_name: {type: DataTypes.STRING,
        allowNull: false,
    },
    message: {type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });
  return ReviewNote;
};
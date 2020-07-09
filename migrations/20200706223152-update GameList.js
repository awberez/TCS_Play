'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     return [ queryInterface.addColumn(
              'GameLists',
              'results',
               Sequelize.STRING
             ),
            queryInterface.addColumn(
             'GameLists',
             'expiration',
             Sequelize.DATE
          )];
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};

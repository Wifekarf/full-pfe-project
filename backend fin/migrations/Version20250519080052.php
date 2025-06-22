<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250519080052 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE affect_user_prog_problem (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, prog_problem_id INT NOT NULL, date_affectation DATETIME NOT NULL, nombre_passed INT DEFAULT 0 NOT NULL, status VARCHAR(20) DEFAULT 'pending' NOT NULL, INDEX IDX_D3EA31DBA76ED395 (user_id), INDEX IDX_D3EA31DB7D7885D (prog_problem_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE affect_user_quiz (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, quiz_id INT NOT NULL, date_affectation DATETIME NOT NULL, nombre_passed INT DEFAULT 0 NOT NULL, status VARCHAR(20) DEFAULT 'pending' NOT NULL, INDEX IDX_1D278B39A76ED395 (user_id), INDEX IDX_1D278B39853CD175 (quiz_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE langages (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, icon VARCHAR(255) NOT NULL, color VARCHAR(7) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE prog_problem (id INT AUTO_INCREMENT NOT NULL, language_id INT DEFAULT NULL, title VARCHAR(255) NOT NULL, description LONGTEXT NOT NULL, nb_tasks INT DEFAULT NULL, points_total INT DEFAULT NULL, date_debut DATETIME DEFAULT NULL, date_fin DATETIME DEFAULT NULL, difficulty VARCHAR(255) NOT NULL, time_limit INT DEFAULT NULL, date_creation DATETIME NOT NULL, code VARCHAR(8) DEFAULT NULL, INDEX IDX_27B2EDE582F1BAF4 (language_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE prog_problem_task (id INT AUTO_INCREMENT NOT NULL, prog_problem_id INT NOT NULL, task_id INT NOT NULL, date_creation DATETIME NOT NULL, INDEX IDX_D765E26F7D7885D (prog_problem_id), INDEX IDX_D765E26F8DB60186 (task_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE question (id INT AUTO_INCREMENT NOT NULL, language_id INT NOT NULL, question_desc VARCHAR(255) NOT NULL, options JSON NOT NULL, correct_answer VARCHAR(255) NOT NULL, difficulty VARCHAR(10) NOT NULL, points INT NOT NULL, time INT DEFAULT NULL, INDEX IDX_B6F7494E82F1BAF4 (language_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE quiz (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, nb_question INT DEFAULT NULL, points_total INT DEFAULT NULL, date_debut DATETIME DEFAULT NULL, date_fin DATETIME DEFAULT NULL, type VARCHAR(255) NOT NULL, date_creation DATETIME NOT NULL, code VARCHAR(8) DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE quiz_question (id INT AUTO_INCREMENT NOT NULL, quiz_id INT NOT NULL, question_id INT NOT NULL, date_creation DATETIME NOT NULL, INDEX IDX_6033B00B853CD175 (quiz_id), INDEX IDX_6033B00B1E27F6BF (question_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE task (id INT AUTO_INCREMENT NOT NULL, language_id INT NOT NULL, task_title VARCHAR(255) NOT NULL, description LONGTEXT NOT NULL, sample_test_cases JSON DEFAULT NULL, model_solution LONGTEXT NOT NULL, difficulty VARCHAR(20) NOT NULL, points INT NOT NULL, time INT DEFAULT NULL, evaluation_criteria JSON DEFAULT NULL, INDEX IDX_527EDB2582F1BAF4 (language_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE team (id INT AUTO_INCREMENT NOT NULL, team_manager_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, INDEX IDX_C4E0A61F46E746A6 (team_manager_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE team_user (team_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_5C722232296CD8AE (team_id), INDEX IDX_5C722232A76ED395 (user_id), PRIMARY KEY(team_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, password VARCHAR(255) NOT NULL, username VARCHAR(255) NOT NULL, email VARCHAR(180) NOT NULL, role VARCHAR(255) DEFAULT 'ROLE_USER' NOT NULL, points_total_all INT DEFAULT 0 NOT NULL, date_creation DATETIME NOT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE user_prog_problem (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, prog_problem_id INT NOT NULL, score_points INT NOT NULL, completed_tasks INT NOT NULL, date_creation DATETIME NOT NULL, code_submissions JSON DEFAULT NULL, llm_evaluations JSON DEFAULT NULL, INDEX IDX_A77E91E7A76ED395 (user_id), INDEX IDX_A77E91E77D7885D (prog_problem_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE user_quiz (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, quiz_id INT NOT NULL, score_points INT NOT NULL, correct_answers INT NOT NULL, date_creation DATETIME NOT NULL, user_answer JSON DEFAULT NULL, INDEX IDX_DE93B65BA76ED395 (user_id), INDEX IDX_DE93B65B853CD175 (quiz_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', available_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', delivered_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_75EA56E0FB7336F0 (queue_name), INDEX IDX_75EA56E0E3BD61CE (available_at), INDEX IDX_75EA56E016BA31DB (delivered_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_prog_problem ADD CONSTRAINT FK_D3EA31DBA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_prog_problem ADD CONSTRAINT FK_D3EA31DB7D7885D FOREIGN KEY (prog_problem_id) REFERENCES prog_problem (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_quiz ADD CONSTRAINT FK_1D278B39A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_quiz ADD CONSTRAINT FK_1D278B39853CD175 FOREIGN KEY (quiz_id) REFERENCES quiz (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem ADD CONSTRAINT FK_27B2EDE582F1BAF4 FOREIGN KEY (language_id) REFERENCES langages (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem_task ADD CONSTRAINT FK_D765E26F7D7885D FOREIGN KEY (prog_problem_id) REFERENCES prog_problem (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem_task ADD CONSTRAINT FK_D765E26F8DB60186 FOREIGN KEY (task_id) REFERENCES task (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE question ADD CONSTRAINT FK_B6F7494E82F1BAF4 FOREIGN KEY (language_id) REFERENCES langages (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_question ADD CONSTRAINT FK_6033B00B853CD175 FOREIGN KEY (quiz_id) REFERENCES quiz (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_question ADD CONSTRAINT FK_6033B00B1E27F6BF FOREIGN KEY (question_id) REFERENCES question (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task ADD CONSTRAINT FK_527EDB2582F1BAF4 FOREIGN KEY (language_id) REFERENCES langages (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team ADD CONSTRAINT FK_C4E0A61F46E746A6 FOREIGN KEY (team_manager_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_user ADD CONSTRAINT FK_5C722232296CD8AE FOREIGN KEY (team_id) REFERENCES team (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_user ADD CONSTRAINT FK_5C722232A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_prog_problem ADD CONSTRAINT FK_A77E91E7A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_prog_problem ADD CONSTRAINT FK_A77E91E77D7885D FOREIGN KEY (prog_problem_id) REFERENCES prog_problem (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz ADD CONSTRAINT FK_DE93B65BA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz ADD CONSTRAINT FK_DE93B65B853CD175 FOREIGN KEY (quiz_id) REFERENCES quiz (id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_prog_problem DROP FOREIGN KEY FK_D3EA31DBA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_prog_problem DROP FOREIGN KEY FK_D3EA31DB7D7885D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_quiz DROP FOREIGN KEY FK_1D278B39A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_quiz DROP FOREIGN KEY FK_1D278B39853CD175
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem DROP FOREIGN KEY FK_27B2EDE582F1BAF4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem_task DROP FOREIGN KEY FK_D765E26F7D7885D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem_task DROP FOREIGN KEY FK_D765E26F8DB60186
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE question DROP FOREIGN KEY FK_B6F7494E82F1BAF4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_question DROP FOREIGN KEY FK_6033B00B853CD175
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_question DROP FOREIGN KEY FK_6033B00B1E27F6BF
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task DROP FOREIGN KEY FK_527EDB2582F1BAF4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team DROP FOREIGN KEY FK_C4E0A61F46E746A6
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_user DROP FOREIGN KEY FK_5C722232296CD8AE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_user DROP FOREIGN KEY FK_5C722232A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_prog_problem DROP FOREIGN KEY FK_A77E91E7A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_prog_problem DROP FOREIGN KEY FK_A77E91E77D7885D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz DROP FOREIGN KEY FK_DE93B65BA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz DROP FOREIGN KEY FK_DE93B65B853CD175
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE affect_user_prog_problem
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE affect_user_quiz
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE langages
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE prog_problem
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE prog_problem_task
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE question
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE quiz
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE quiz_question
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE task
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE team
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE team_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE user_prog_problem
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE user_quiz
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE messenger_messages
        SQL);
    }
}

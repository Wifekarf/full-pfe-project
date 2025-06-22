<?php

namespace App\Controller;

use App\Entity\Langages;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\QuestionRepository; // Corrected to use QuestionRepository
use App\Entity\Question; // Corrected to use Question Entity
use App\Entity\QuizQuestion;

#[Route('/api/questions', name: 'api_questions_')]
class QuestionController extends AbstractController
{
    private $em;
    private $questionRepository;

    public function __construct(EntityManagerInterface $em, QuestionRepository $questionRepository)
    {
        $this->em = $em;
        $this->questionRepository = $questionRepository;
    }

    // Lister toutes les questions
    #[Route('/', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {

    
        // Assuming 'findByFilters' is implemented in the repository
        $questions = $this->questionRepository->findAll();

        $data = [];
        foreach ($questions as $question) {
            $data[] = [
                'id' => $question->getId(),
                'question' => $question->getQuestion(),
                'options' => $question->getOptions(),
                'correctAnswer' => $question->getCorrectAnswer(),
                'difficulty' => $question->getDifficulty(),
                'language' => $question->getLanguage(), // Assuming a language relation
                'points' => $question->getPoints(),
                'time' => $question->getTime(), // ⏱️ Ajout ici

            ];
        }

        return $this->json($data);
    }

    // Afficher une question par son ID
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $question = $this->questionRepository->find($id);

        if (!$question) {
            return $this->json(['error' => 'Question not found'], 404);
        }

        return $this->json([
            'id' => $question->getId(),
            'question' => $question->getQuestion(),
            'options' => $question->getOptions(),
            'correctAnswer' => $question->getCorrectAnswer(),
            'difficulty' => $question->getDifficulty(),
            'language' => $question->getLanguage(), 
            'points' => $question->getPoints(),
            'time' => $question->getTime(), // ⏱️ Ajout ici

        ]);
    }

    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
    
        // Vérification des champs obligatoires
        $requiredFields = ['question', 'options', 'correctAnswer', 'difficulty', 'points', 'language_id', 'time'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $this->json(['error' => "Missing required field: $field"], 400);
            }
        }
    
        // Création de la nouvelle question
        $question = new Question();
        $question->setQuestion($data['question']);
        $question->setOptions($data['options']);
        $question->setCorrectAnswer($data['correctAnswer']);
        $question->setDifficulty($data['difficulty']);
        $question->setPoints($data['points']);
        $question->setTime($data['time']); 
    
        // Récupération de la langue
        $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
        if (!$language) {
            return $this->json(['error' => 'Invalid language'], 400);
        }
        $question->setLanguage($language);
    
        // Sauvegarde
        $this->em->persist($question);
        $this->em->flush();
    
        return $this->json([
            'id' => $question->getId(),
            'message' => 'Question created successfully!',
        ], 201);
    }
    
    // Mettre à jour une question existante
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $question = $this->questionRepository->find($id);

        if (!$question) {
            return $this->json(['error' => 'Question not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $question->setQuestion($data['question'] ?? $question->getQuestion());
        $question->setOptions($data['options'] ?? $question->getOptions());
        $question->setCorrectAnswer($data['correctAnswer'] ?? $question->getCorrectAnswer());
        $question->setDifficulty($data['difficulty'] ?? $question->getDifficulty());
        $question->setPoints($data['points'] ?? $question->getPoints());
        $question->setTime($data['time'] ?? $question->getTime());

        // Optionally update the language
        if (isset($data['language_id'])) {
            $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
            if ($language) {
                $question->setLanguage($language);
            }
        }

        $this->em->flush();

        return $this->json([
            'id' => $question->getId(),
            'message' => 'Question updated successfully!',
        ]);
    }

    // Supprimer une question
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $question = $this->questionRepository->find($id);
    
        if (!$question) {
            return $this->json(['error' => 'Question not found'], 404);
        }
    
        // Remove all related quiz_question entries before deleting the question
        $quizQuestionRepository = $this->em->getRepository(QuizQuestion::class);
        $linkedQuizQuestions = $quizQuestionRepository->findBy(['question' => $question]);
    
        foreach ($linkedQuizQuestions as $quizQuestion) {
            $this->em->remove($quizQuestion);
        }
    
        $this->em->remove($question); // Remove the question once
        $this->em->flush();           // Flush once after all removes
    
        return $this->json(['message' => 'Question deleted successfully!']);
    }
    
}

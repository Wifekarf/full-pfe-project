<?php

namespace App\Controller;

use App\Entity\AffectUserProgProblem;
use App\Entity\ProgProblem;
use App\Entity\ProgProblemTask;
use App\Entity\Task;
use App\Entity\User;
use App\Entity\UserProgProblem;
use App\Repository\AffectUserProgProblemRepository;
use App\Repository\ProgProblemRepository;
use App\Repository\ProgProblemTaskRepository;
use App\Repository\TaskRepository;
use App\Repository\UserProgProblemRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpClient\HttpClient;

#[Route('/prog-actions', name: 'prog_actions_')]
class ProgActionsController extends AbstractController
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    #[Route('/assign-tasks-to-problem', name: 'assign_tasks_to_problem', methods: ['POST'])]
    public function assignTasksToProblem(
        Request $request,
        ProgProblemRepository $progProblemRepository,
        TaskRepository $taskRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        // Validation
        if (!isset($data['progProblemId'])) {
            return $this->json(['error' => 'progProblemId is required'], 400);
        }
        if (!isset($data['taskIds']) || !is_array($data['taskIds'])) {
            return $this->json(['error' => 'taskIds is required and must be an array'], 400);
        }

        // Find the programming problem
        $progProblem = $progProblemRepository->find($data['progProblemId']);
        if (!$progProblem) {
            return $this->json(['error' => 'Programming problem not found'], 404);
        }

        $addedTasks = [];
        $alreadyAssignedTasks = [];
        $totalNewPoints = 0;

        foreach ($data['taskIds'] as $taskId) {
            $task = $taskRepository->find($taskId);
            if (!$task) continue;

            // Check if relation already exists
            $existingRelation = $this->em->getRepository(ProgProblemTask::class)->findOneBy([
                'progProblem' => $progProblem,
                'task' => $task
            ]);

            if ($existingRelation) {
                $alreadyAssignedTasks[] = $taskId;
                continue;
            }

            // Create new relation
            $progProblemTask = new ProgProblemTask();
            $progProblemTask->setProgProblem($progProblem);
            $progProblemTask->setTask($task);
            $this->em->persist($progProblemTask);

            $addedTasks[] = $taskId;
            $totalNewPoints += $task->getPoints();
        }

        // If no tasks added
        if (empty($addedTasks)) {
            return $this->json([
                'message' => 'No new tasks added. All tasks are already assigned.',
                'already_assigned_tasks' => $alreadyAssignedTasks
            ]);
        }

        $this->em->flush(); // Save new relations first

        // Update total points by recalculating
        $relations = $this->em->getRepository(ProgProblemTask::class)->findBy(['progProblem' => $progProblem]);
        $totalPoints = 0;
        foreach ($relations as $rel) {
            $totalPoints += $rel->getTask()->getPoints();
        }
        $progProblem->setPointsTotal($totalPoints);

        // Update number of tasks
        $progProblem->setNbTasks(count($relations));

        $this->em->flush(); // Save problem updates

        return $this->json([
            'message' => 'Tasks assignment completed',
            'prog_problem_id' => $progProblem->getId(),
            'tasks_added' => $addedTasks,
            'already_assigned_tasks' => $alreadyAssignedTasks,
            'total_points' => $progProblem->getPointsTotal(),
            'nb_tasks' => $progProblem->getNbTasks()
        ]);
    }

    #[Route('/assign-problem', name: 'assign_problem', methods: ['POST'])]
    public function assignProblem(
        Request $request,
        UserRepository $userRepository,
        ProgProblemRepository $progProblemRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        // Validation
        if (!isset($data['userId']) || !isset($data['progProblemId'])) {
            return $this->json(['error' => 'userId and progProblemId are required'], 400);
        }

        // Find entities
        $user = $userRepository->find($data['userId']);
        $progProblem = $progProblemRepository->find($data['progProblemId']);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        if (!$progProblem) {
            return $this->json(['error' => 'Programming problem not found'], 404);
        }

        // Check if already assigned
        $existing = $this->em->getRepository(AffectUserProgProblem::class)->findOneBy([
            'user' => $user,
            'progProblem' => $progProblem
        ]);

        if ($existing) {
            return $this->json(['error' => 'This programming problem is already assigned to this user'], 400);
        }

        // Create assignment
        $affectation = new AffectUserProgProblem();
        $affectation->setUser($user);
        $affectation->setProgProblem($progProblem);

        $this->em->persist($affectation);
        $this->em->flush();

        return $this->json([
            'message' => 'Programming problem assigned successfully to user',
            'assignmentId' => $affectation->getId()
        ], 201);
    }

    #[Route('/unassign-problem', name: 'unassign_problem', methods: ['POST'])]
    public function unassignProblem(
        Request $request,
        UserRepository $userRepository,
        ProgProblemRepository $progProblemRepository,
        AffectUserProgProblemRepository $affectUserProgProblemRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        // Validation
        if (!isset($data['userId']) || !isset($data['progProblemId'])) {
            return $this->json(['error' => 'userId and progProblemId are required'], 400);
        }

        // Find entities
        $user = $userRepository->find($data['userId']);
        $progProblem = $progProblemRepository->find($data['progProblemId']);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        if (!$progProblem) {
            return $this->json(['error' => 'Programming problem not found'], 404);
        }

        // Find assignment
        $affectation = $affectUserProgProblemRepository->findOneBy([
            'user' => $user,
            'progProblem' => $progProblem
        ]);

        if (!$affectation) {
            return $this->json(['error' => 'No assignment found for this user and programming problem'], 404);
        }

        // Remove assignment
        $this->em->remove($affectation);
        $this->em->flush();

        return $this->json([
            'message' => 'Programming problem unassigned successfully',
            'deletedAssignmentId' => $affectation->getId(),
            'userId' => $user->getId(),
            'progProblemId' => $progProblem->getId()
        ]);
    }

    #[Route('/start-problem', name: 'start_problem', methods: ['POST'])]
    public function startProblem(
        Request $request,
        UserRepository $userRepository,
        ProgProblemRepository $progProblemRepository,
        AffectUserProgProblemRepository $affectUserProgProblemRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        // Validation
        if (!isset($data['userId']) || !isset($data['progProblemId'])) {
            return $this->json(['error' => 'userId and progProblemId are required'], 400);
        }

        // Find entities
        $user = $userRepository->find($data['userId']);
        $progProblem = $progProblemRepository->find($data['progProblemId']);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }
        if (!$progProblem) {
            return $this->json(['error' => 'Programming problem not found'], 404);
        }

        // Find assignment
        $affectation = $affectUserProgProblemRepository->findOneBy([
            'user' => $user,
            'progProblem' => $progProblem
        ]);

        if (!$affectation) {
            return $this->json(['error' => 'This programming problem is not assigned to this user'], 400);
        }

        // Update assignment
        $affectation->setNombrePassed($affectation->getNombrePassed() + 1);
        $affectation->setStatus('in progress');

        $this->em->persist($affectation);
        $this->em->flush();

        return $this->json([
            'message' => 'Programming problem started successfully',
            'affectationId' => $affectation->getId(),
            'nombrePassed' => $affectation->getNombrePassed(),
            'status' => $affectation->getStatus()
        ]);
    }

    #[Route('/get-affected-problems-by-user', name: 'get_affected_problems_by_user', methods: ['POST'])]
    public function getAffectedProblemsByUser(
        Request $request,
        AffectUserProgProblemRepository $affectUserProgProblemRepository,
        ProgProblemTaskRepository $progProblemTaskRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        // Validation
        if (!isset($data['userId'])) {
            return $this->json(['error' => 'userId is required'], 400);
        }

        // Get affected problems
        $affectedProblems = $affectUserProgProblemRepository->findBy([
            'user' => $data['userId'],
            'status' => 'pending' // Only pending problems
        ]);

        $formatted = [];

        foreach ($affectedProblems as $affectation) {
            $progProblem = $affectation->getProgProblem();

            // Get all tasks for this problem with their languages
            $progProblemTasks = $progProblemTaskRepository->findBy(['progProblem' => $progProblem]);
            $tasksData = [];

            foreach ($progProblemTasks as $ppt) {
                $task = $ppt->getTask();
                $language = $task->getLanguage();

                $tasksData[] = [
                    'id' => $task->getId(),
                    'title' => $task->getTitle(),
                    'description' => $task->getDescription(),
                    'sampleTestCases' => $task->getSampleTestCases(),
                    'difficulty' => $task->getDifficulty(),
                    'points' => $task->getPoints(),
                    'time' => $task->getTime(),
                    'evaluationCriteria' => $task->getEvaluationCriteria(),
                    'language' => $language ? [
                        'id' => $language->getId(),
                        'name' => $language->getNom(),
                        'description' => $language->getDescription(),
                        'icon' => $language->getIcon(),
                        'color' => $language->getColor()
                    ] : null
                ];
            }

            $formatted[] = [
                'affectationId' => $affectation->getId(),
                'progProblem' => [
                    'id' => $progProblem->getId(),
                    'title' => $progProblem->getTitle(),
                    'description' => $progProblem->getDescription(),
                    'totalTasks' => $progProblem->getNbTasks(),
                    'totalPoints' => $progProblem->getPointsTotal(),
                    'difficulty' => $progProblem->getDifficulty(),
                    'startDate' => $progProblem->getDateDebut()?->format('Y-m-d H:i:s'),
                    'endDate' => $progProblem->getDateFin()?->format('Y-m-d H:i:s'),
                    'tasks' => $tasksData
                ],
                'dateAffectation' => $affectation->getDateAffectation()->format('Y-m-d H:i:s'),
                'status' => $affectation->getStatus(),
                'nombrePassed' => $affectation->getNombrePassed()
            ];
        }

        return $this->json([
            'count' => count($formatted),
            'progProblems' => $formatted
        ]);
    }

    #[Route('/submit-solution', name: 'submit_solution', methods: ['POST'])]
    public function submitSolution(
        Request $request,
        UserRepository $userRepository,
        ProgProblemRepository $progProblemRepository,
        TaskRepository $taskRepository,
        AffectUserProgProblemRepository $affectUserProgProblemRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        // Validation
        $requiredFields = ['userId', 'progProblemId', 'codeSubmissions'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $this->json(['error' => "Field $field is required"], 400);
            }
        }

        // Find entities
        $user = $userRepository->find($data['userId']);
        $progProblem = $progProblemRepository->find($data['progProblemId']);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }
        if (!$progProblem) {
            return $this->json(['error' => 'Programming problem not found'], 404);
        }

        // Create new history entry
        $userProgProblem = new UserProgProblem();
        $userProgProblem->setUser($user);
        $userProgProblem->setProgProblem($progProblem);
        $userProgProblem->setCodeSubmissions($data['codeSubmissions']);
        
        // Initialize values to avoid null database entries
        $userProgProblem->setScorePoints(0);
        $userProgProblem->setCompletedTasks(0);
        $userProgProblem->setDateCreation(new \DateTime());
        
        // Process and evaluate code submissions
        $evaluations = [];
        $completedTasks = 0;
        $totalScore = 0;
        
        foreach ($data['codeSubmissions'] as $taskId => $submission) {
            $task = $taskRepository->find($taskId);
            if (!$task) continue;
            
            try {
                // Evaluate with LLM
                $evaluation = $this->evaluateWithLLM(
                    $submission['code'],
                    $task->getModelSolution() ?? '',
                    $task->getDescription() ?? '',
                    $task->getEvaluationCriteria() ?? []
                );
                
                $evaluations[$taskId] = $evaluation;
                $totalScore += $evaluation['score'];
                
                if ($evaluation['score'] >= $task->getPoints() * 0.7) { // 70% threshold for "completed"
                    $completedTasks++;
                }
            } catch (\Exception $e) {
                // Log the error and continue with default values
                $evaluations[$taskId] = [
                    'score' => 0,
                    'feedback' => 'Error during evaluation: ' . $e->getMessage(),
                    'strengths' => [],
                    'weaknesses' => ['Failed to evaluate due to a technical error']
                ];
            }
        }
        
        // Make sure we save the evaluations as JSON
        $userProgProblem->setLlmEvaluations($evaluations);
        $userProgProblem->setScorePoints($totalScore);
        $userProgProblem->setCompletedTasks($completedTasks);
        
        // Explicitly persist the user submission
        $this->em->persist($userProgProblem);
        
        // Update assignment status
        $affectation = $affectUserProgProblemRepository->findOneBy([
            'user' => $user,
            'progProblem' => $progProblem
        ]);
        
        if ($affectation) {
            $affectation->setStatus('completed');
            // Increment nombrePassed when solution is submitted, if not yet incremented
            if ($affectation->getStatus() !== 'in progress') {
                $affectation->setNombrePassed($affectation->getNombrePassed() + 1);
            }
            $this->em->persist($affectation);
        }
        
        // Explicitly flush to save all changes to the database
        $this->em->flush();
        
        return $this->json([
            'message' => 'Solution submitted and evaluated successfully',
            'submissionId' => $userProgProblem->getId(),
            'totalScore' => $totalScore,
            'completedTasks' => $completedTasks,
            'evaluations' => $evaluations
        ], 201);
    }
    
    /**
     * Evaluate code using LLM API
     * @param string $userCode User's submitted code
     * @param string $modelSolution Model solution to compare against
     * @param string $problem Problem description
     * @param array $criteria Evaluation criteria
     * @return array Evaluation results with score, feedback, strengths, and weaknesses
     */
    private function evaluateWithLLM(string $userCode, string $modelSolution, string $problem, array $criteria = []): array
    {
        try {
            $apiKey = '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';
            $client = \Symfony\Component\HttpClient\HttpClient::create();
            $criteriaText = '';
            if (!empty($criteria)) {
                $criteriaText = "Evaluation criteria:\n";
                foreach ($criteria as $criterion) {
                    if (is_array($criterion) && isset($criterion['name']) && isset($criterion['description'])) {
                        $criteriaText .= "- {$criterion['name']}: {$criterion['description']}\n";
                    }
                }
            } else {
                $criteriaText = "Evaluate on correctness, efficiency, code quality, and edge case handling.";
            }

            $prompt = "You are a strict programming code evaluator.\n" .
                "Evaluate the user's code solution for the following problem.\n\n" .
                "Problem Description:\n$problem\n\n" .
                "Model Solution:\n" .
                "```\n$modelSolution\n```\n\n" .
                "User Solution:\n" .
                "```\n$userCode\n```\n\n" .
                "$criteriaText\n\n" .
                "Instructions:\n" .
                "- If the user's code does not attempt to solve the problem, is empty, or is just a comment, give a score of 0 and explain why.\n" .
                "- If the code is syntactically invalid, give a score of 0 and explain the syntax errors.\n" .
                "- If the code does not match the logic of the model solution, penalize heavily.\n" .
                "- Only give high scores if the code is correct, complete, and efficient.\n" .
                "- Be strict and do not reward nonsense or placeholder code.\n\n" .
                "Format your response as JSON with the following fields:\n" .
                "- score: numeric score between 0-100\n" .
                "- feedback: brief overall assessment\n" .
                "- strengths: array of strengths\n" .
                "- weaknesses: array of weaknesses\n";

            $messages = [
                [
                    'role' => 'system',
                    'content' => 'You are a strict programming code evaluator. Only return valid JSON.'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ];

            $response = $client->request('POST', 'https://api.groq.com/openai/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'llama3-70b-8192',
                    'messages' => $messages,
                    'temperature' => 0.1,
                    'max_tokens' => 1000,
                    'response_format' => [ 'type' => 'json_object' ]
                ]
            ]);

            $data = $response->toArray();
            $evaluation = json_decode($data['choices'][0]['message']['content'], true);

            // Validate and normalize the response
            if (!isset($evaluation['score'])) {
                $evaluation['score'] = 0;
            }
            if (!isset($evaluation['feedback'])) { 
                $evaluation['feedback'] = 'No feedback provided';
            }
            if (!isset($evaluation['strengths']) || !is_array($evaluation['strengths'])) {
                $evaluation['strengths'] = [];
            }
            if (!isset($evaluation['weaknesses']) || !is_array($evaluation['weaknesses'])) {
                $evaluation['weaknesses'] = [];
            }
            $evaluation['passed'] = $evaluation['score'] >= 70;

            return $evaluation;
        } catch (\Exception $e) {
            error_log('Error in code evaluation: ' . $e->getMessage() . ' - Trace: ' . $e->getTraceAsString());
            return [
                'score' => 0,
                'feedback' => 'Could not evaluate code due to a system error: ' . $e->getMessage(),
                'strengths' => [],
                'weaknesses' => ['Unable to complete evaluation due to technical issues'],
                'passed' => false
            ];
        }
    }
    
    #[Route('/get-user-problem-history', name: 'get_user_problem_history', methods: ['POST'])]
    public function getUserProblemHistory(
        Request $request,
        UserRepository $userRepository,
        UserProgProblemRepository $userProgProblemRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['userId'])) {
            return $this->json(['error' => 'userId is required'], 400);
        }
        
        $user = $userRepository->find($data['userId']);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }
        
        $history = $userProgProblemRepository->findBy(['user' => $user], ['dateCreation' => 'DESC']);
        
        $formatted = [];
        foreach ($history as $submission) {
            $progProblem = $submission->getProgProblem();
            
            $formatted[] = [
                'id' => $submission->getId(),
                'progProblem' => [
                    'id' => $progProblem->getId(),
                    'title' => $progProblem->getTitle(),
                    'difficulty' => $progProblem->getDifficulty()
                ],
                'score' => $submission->getScorePoints(),
                'completedTasks' => $submission->getCompletedTasks(),
                'totalTasks' => $progProblem->getNbTasks(),
                'dateSubmission' => $submission->getDateCreation()->format('Y-m-d H:i:s'),
                'evaluations' => $submission->getLlmEvaluations()
            ];
        }
        
        return $this->json([
            'count' => count($formatted),
            'history' => $formatted
        ]);
    }

    #[Route('/problem-tasks/{id}', name: 'problem_tasks', methods: ['GET'])]
    public function getProblemTasks(int $id): JsonResponse
    {
        $progProblem = $this->em->getRepository(ProgProblem::class)->find($id);

        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $conn = $this->em->getConnection();
        $sql = <<<'SQL'
            SELECT 
                t.id
            FROM task t
            INNER JOIN prog_problem_task ppt ON ppt.task_id = t.id
            WHERE ppt.prog_problem_id = :problemId
        SQL;

        $results = $conn->executeQuery($sql, ['problemId' => $id])->fetchAllAssociative();
        $taskIds = array_map(fn($t) => $t['id'], $results);

        return $this->json([
            'task_ids' => $taskIds
        ]);
    }

    #[Route('/unassign-task-from-problem/{problemId}/{taskId}', name: 'unassign_task_from_problem', methods: ['POST'])]
    public function unassignTaskFromProblem(
        int $problemId,
        int $taskId,
        ProgProblemTaskRepository $progProblemTaskRepository,
        ProgProblemRepository $progProblemRepository,
        TaskRepository $taskRepository
    ): JsonResponse {
        // Find the programming problem
        $progProblem = $progProblemRepository->find($problemId);
        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        // Find the task
        $task = $taskRepository->find($taskId);
        if (!$task) {
            return $this->json(['message' => 'Task not found'], 404);
        }

        // Find the association
        $association = $progProblemTaskRepository->findOneBy([
            'progProblem' => $progProblem,
            'task' => $task
        ]);

        if (!$association) {
            return $this->json(['message' => 'Task is not assigned to this programming problem'], 404);
        }

        // Remove the association
        $this->em->remove($association);
        
        // Get the task's points to subtract from the total
        $taskPoints = $task->getPoints();
        
        // Update the prog problem
        $progProblem->setNbTasks($progProblem->getNbTasks() - 1);
        $progProblem->setPointsTotal($progProblem->getPointsTotal() - $taskPoints);
        
        $this->em->flush();

        return $this->json([
            'message' => 'Task successfully unassigned from programming problem',
            'problemId' => $problemId,
            'taskId' => $taskId,
            'updated_task_count' => $progProblem->getNbTasks(),
            'updated_points' => $progProblem->getPointsTotal()
        ]);
    }

    #[Route('/get-all-affected-users', name: 'get_all_affected_users', methods: ['GET'])]
    public function getAllAffectedUsers(
        AffectUserProgProblemRepository $affectUserProgProblemRepository,
        ProgProblemTaskRepository $progProblemTaskRepository
    ): JsonResponse {
        // Récupérer toutes les affectations triées par date
        $affectedProblems = $affectUserProgProblemRepository->findBy([], ['dateAffectation' => 'DESC']);

        $formatted = [];

        foreach ($affectedProblems as $affectation) {
            $user = $affectation->getUser();
            $progProblem = $affectation->getProgProblem();

            // Récupérer les tâches du problème de programmation (simplifié pour la vue admin)
            $progProblemTasks = $progProblemTaskRepository->findBy(['progProblem' => $progProblem]);
            $tasksCount = count($progProblemTasks);

            $formatted[] = [
                'affectationId' => $affectation->getId(),
                'user' => [
                    'id' => $user->getId(),
                    'username' => $user->getUsername(),
                    'email' => $user->getEmail()
                ],
                'progProblem' => [
                    'id' => $progProblem->getId(),
                    'title' => $progProblem->getTitle(),
                    'totalTasks' => $progProblem->getNbTasks(),
                    'totalPoints' => $progProblem->getPointsTotal()
                ],
                'dateAffectation' => $affectation->getDateAffectation()->format('Y-m-d H:i:s'),
                'nombrePassed' => $affectation->getNombrePassed(),
                'status' => $affectation->getStatus(),
                'progProblemDetails' => [
                    'startDate' => $progProblem->getDateDebut()?->format('Y-m-d H:i:s'),
                    'endDate' => $progProblem->getDateFin()?->format('Y-m-d H:i:s'),
                    'tasksCount' => $tasksCount
                ]
            ];
        }

        return $this->json([
            'count' => count($formatted),
            'affectations' => $formatted
        ]);
    }

    #[Route('/get-submission/{id}', name: 'get_submission', methods: ['GET'])]
    public function getSubmission(
        int $id,
        UserProgProblemRepository $userProgProblemRepository
    ): JsonResponse {
        $submission = $userProgProblemRepository->find($id);
        
        if (!$submission) {
            return $this->json(['error' => 'Submission not found'], 404);
        }
        
        $progProblem = $submission->getProgProblem();
        $user = $submission->getUser();
        
        return $this->json([
            'id' => $submission->getId(),
            'user' => [
                'id' => $user->getId(),
                'username' => $user->getUsername()
            ],
            'progProblem' => [
                'id' => $progProblem->getId(),
                'title' => $progProblem->getTitle()
            ],
            'scorePoints' => $submission->getScorePoints(),
            'completedTasks' => $submission->getCompletedTasks(),
            'dateCreation' => $submission->getDateCreation()->format('Y-m-d H:i:s'),
            'codeSubmissions' => $submission->getCodeSubmissions(),
            'evaluations' => $submission->getLlmEvaluations()
        ]);
    }

    #[Route('/evaluate-solutions', name: 'evaluate_solutions', methods: ['POST'])]
    public function evaluateSolutions(
        Request $request,
        UserRepository $userRepository,
        ProgProblemRepository $progProblemRepository,
        TaskRepository $taskRepository
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);
            
            // Log the incoming request data
            error_log("evaluateSolutions received data: " . json_encode($data));

            // Validation
            $requiredFields = ['userId', 'progProblemId', 'solutions'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    return $this->json(['error' => "Field $field is required"], 400);
                }
            }

            // Find entities
            $user = $userRepository->find($data['userId']);
            $progProblem = $progProblemRepository->find($data['progProblemId']);

            if (!$user) {
                return $this->json(['error' => 'User not found'], 404);
            }
            if (!$progProblem) {
                return $this->json(['error' => 'Programming problem not found'], 404);
            }

            // Format for codeSubmissions
            $codeSubmissions = [];
            $evaluations = [];
            $completedTasks = 0;
            $totalScore = 0;

            // Check if we have at least one valid solution
            if (empty($data['solutions']) || !is_array($data['solutions'])) {
                return $this->json(['error' => 'No valid solutions provided'], 400);
            }

            // Process each solution
            foreach ($data['solutions'] as $solution) {
                if (!isset($solution['taskId']) || !isset($solution['code'])) {
                    continue; // Skip invalid solutions
                }

                $taskId = $solution['taskId'];
                $code = $solution['code'];
                $language = $solution['language'] ?? 'unknown';

                // Store the code submission
                $codeSubmissions[$taskId] = [
                    'code' => $code,
                    'language' => $language
                ];

                // Find the task
                $task = $taskRepository->find($taskId);
                if (!$task) {
                    error_log("Task not found: $taskId");
                    $evaluations[$taskId] = [
                        'score' => 0,
                        'feedback' => 'Task not found in database',
                        'strengths' => [],
                        'weaknesses' => ['Cannot evaluate - task definition missing'],
                        'passed' => false
                    ];
                    continue;
                }

                try {
                    // Get task properties with null handling
                    $taskDescription = $task->getDescription() ?: "No description available";
                    $modelSolution = $task->getModelSolution() ?: "# Model solution not provided";
                    $criteriaArray = $task->getEvaluationCriteria() ?: [];
                    
                    // Log task details for debugging
                    error_log("Processing task #$taskId: " . substr($taskDescription, 0, 50) . "...");
                    
                    // Evaluate with LLM
                    $evaluation = $this->evaluateWithLLM(
                        $code,
                        $modelSolution,
                        $taskDescription,
                        $criteriaArray
                    );

                    $taskPoints = $task->getPoints() ?: 10; // Default to 10 if no points set
                    $scaledScore = ($evaluation['score'] / 100) * $taskPoints; // Convert 0-100 to task points
                    
                    // Store the evaluation result
                    $evaluations[$taskId] = [
                        'score' => $scaledScore,
                        'feedback' => $evaluation['feedback'],
                        'strengths' => $evaluation['strengths'],
                        'weaknesses' => $evaluation['weaknesses'],
                        'passed' => $evaluation['passed'] ?? ($evaluation['score'] >= 70) // 70% threshold for passing
                    ];

                    $totalScore += $scaledScore;

                    // Check if task is considered completed (70% threshold)
                    if ($evaluation['score'] >= 70) {
                        $completedTasks++;
                    }
                } catch (\Exception $e) {
                    // Log the error
                    error_log('Error evaluating task #' . $taskId . ': ' . $e->getMessage() . "\n" . $e->getTraceAsString());
                    
                    // Add a failed evaluation 
                    $evaluations[$taskId] = [
                        'score' => 0,
                        'feedback' => 'Error during evaluation: ' . $e->getMessage(),
                        'strengths' => [],
                        'weaknesses' => ['Failed to evaluate due to a technical error'],
                        'passed' => false
                    ];
                }
            }

            // Create new submission record in the database
            $userProgProblem = new UserProgProblem();
            $userProgProblem->setUser($user);
            $userProgProblem->setProgProblem($progProblem);
            $userProgProblem->setCodeSubmissions($codeSubmissions);
            $userProgProblem->setLlmEvaluations($evaluations);
            $userProgProblem->setScorePoints((int)$totalScore);
            $userProgProblem->setCompletedTasks($completedTasks);
            $userProgProblem->setDateCreation(new \DateTime());

            // Persist to database
            $this->em->persist($userProgProblem);
            $this->em->flush();

            error_log("Submission saved successfully with ID: " . $userProgProblem->getId());
            
            // Return the results
            return $this->json([
                'success' => true,
                'submissionId' => $userProgProblem->getId(),
                'totalScore' => $totalScore,
                'completedTasks' => $completedTasks,
                'totalTasks' => count($data['solutions']),
                'evaluations' => $evaluations
            ]);
        } catch (\Exception $e) {
            // Log any uncaught exceptions
            error_log('Uncaught exception in evaluateSolutions: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            
            return $this->json([
                'error' => 'An unexpected error occurred during evaluation',
                'message' => $e->getMessage(),
                'success' => false
            ], 500);
        }
    }
    #[Route('/get-all-problem-history-admin', name: 'get_all_problem_history_admin', methods: ['POST'])]
public function getAllProblemHistoryAdmin(
    UserProgProblemRepository $userProgProblemRepository
): JsonResponse {
    $history = $userProgProblemRepository->findBy([], ['dateCreation' => 'DESC']);

    $formatted = [];
    foreach ($history as $submission) {
        $progProblem = $submission->getProgProblem();
        $user = $submission->getUser();

        $formatted[] = [
            'id' => $submission->getId(),
            'user' => [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'email' => $user->getEmail()
            ],
            'progProblem' => [
                'id' => $progProblem->getId(),
                'title' => $progProblem->getTitle(),
                'difficulty' => $progProblem->getDifficulty()
            ],
            'score' => $submission->getScorePoints(),
            'completedTasks' => $submission->getCompletedTasks(),
            'totalTasks' => $progProblem->getNbTasks(),
            'dateSubmission' => $submission->getDateCreation()->format('Y-m-d H:i:s'),
            'evaluations' => $submission->getLlmEvaluations()
        ];
    }

    return $this->json([
        'count' => count($formatted),
        'history' => $formatted
    ]);
}

} 
<?php

namespace App\Controller;

use App\Entity\Langages;
use App\Entity\Task;
use App\Entity\ProgProblemTask;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/tasks', name: 'api_tasks_')]
class TaskController extends AbstractController
{
    private EntityManagerInterface $em;
    private TaskRepository $taskRepository;

    public function __construct(EntityManagerInterface $em, TaskRepository $taskRepository)
    {
        $this->em = $em;
        $this->taskRepository = $taskRepository;
    }

    #[Route('/', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $tasks = $this->taskRepository->findAll();

        $data = [];
        foreach ($tasks as $task) {
            $language = $task->getLanguage();
            $data[] = [
                'id' => $task->getId(),
                'task_title' => $task->getTitle(),
                'description' => $task->getDescription(),
                'sampleTestCases' => $task->getSampleTestCases(),
                'difficulty' => $task->getDifficulty(),
                'points' => $task->getPoints(),
                'time' => $task->getTime(),
                'evaluationCriteria' => $task->getEvaluationCriteria(),
                'language_id' => $language ? $language->getId() : null,
            ];
        }

        return $this->json($data);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json(['error' => 'Task not found'], 404);
        }

        $language = $task->getLanguage();
        return $this->json([
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'description' => $task->getDescription(),
            'sampleTestCases' => $task->getSampleTestCases(),
            'modelSolution' => $task->getModelSolution(),
            'difficulty' => $task->getDifficulty(),
            'points' => $task->getPoints(),
            'time' => $task->getTime(),
            'evaluationCriteria' => $task->getEvaluationCriteria(),
            'language' => $language ? [
                'id' => $language->getId(),
                'name' => $language->getNom(),
                'icon' => $language->getIcon(),
                'color' => $language->getColor()
            ] : null,
        ]);
    }

    /**
     * Creates a new Task entity from the given data
     *
     * @param array $data Task data
     * @return Task|JsonResponse Returns a task entity or error response
     */
    public function createTaskFromData(array $data)
    {
        // Required fields validation
        $requiredFields = ['title', 'description', 'points', 'language_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $this->json(['error' => "Missing required field: $field"], 400);
            }
        }
    
        // Create the new task
        $task = new Task();
        $task->setTitle($data['title']);
        $task->setDescription($data['description']);
        $task->setSampleTestCases($data['sampleTestCases'] ?? []);
        $task->setModelSolution($data['modelSolution'] ?? 'No solution provided');
        $task->setDifficulty($data['difficulty'] ?? 'medium');
        $task->setPoints($data['points']);
        $task->setTime($data['time'] ?? null);
        $task->setEvaluationCriteria($data['evaluationCriteria'] ?? []);
    
        // Set language
        $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
        if (!$language) {
            return $this->json(['error' => 'Invalid language ID: ' . $data['language_id']], 400);
        }
        $task->setLanguage($language);
    
        return $task;
    }

    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
    
        // Required fields validation
        $requiredFields = ['task_title', 'description', 'points', 'language_id', 'time'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $this->json(['error' => "Missing required field: $field"], 400);
            }
        }
    
        // Create the new task
        $task = new Task();
        $task->setTitle($data['task_title']); // Use task_title directly
        $task->setDescription($data['description']);
        $task->setSampleTestCases($data['sampleTestCases'] ?? []);
        $task->setModelSolution($data['modelSolution'] ?? 'No solution provided');
        $task->setDifficulty($data['difficulty'] ?? 'medium');
        $task->setPoints($data['points']);
        $task->setTime($data['time']);
        $task->setEvaluationCriteria($data['evaluationCriteria'] ?? []);
    
        // Get language from ID
        $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
        if (!$language) {
            return $this->json(['error' => 'Invalid language'], 400);
        }
        $task->setLanguage($language);
    
        // Save
        $this->em->persist($task);
        $this->em->flush();
    
        return $this->json([
            'id' => $task->getId(),
            'message' => 'Task created successfully!',
        ], 201);
    }
    
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $task = $this->taskRepository->find($id);

        if (!$task) {
            return $this->json(['error' => 'Task not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        // Map task_title to title if it exists
        if (isset($data['task_title'])) {
            $data['title'] = $data['task_title'];
        }
        
        // Map frontend field names to expected names
        if (isset($data['sample_test_cases'])) {
            $data['sampleTestCases'] = $data['sample_test_cases'];
        }
        
        if (isset($data['evaluation_criteria'])) {
            $data['evaluationCriteria'] = $data['evaluation_criteria'];
        }

        if (isset($data['title'])) $task->setTitle($data['title']);
        if (isset($data['description'])) $task->setDescription($data['description']);
        if (isset($data['sampleTestCases'])) $task->setSampleTestCases($data['sampleTestCases']);
        if (isset($data['modelSolution'])) $task->setModelSolution($data['modelSolution']);
        if (isset($data['difficulty'])) $task->setDifficulty($data['difficulty']);
        if (isset($data['points'])) $task->setPoints($data['points']);
        if (isset($data['time'])) $task->setTime($data['time']);
        if (isset($data['evaluationCriteria'])) $task->setEvaluationCriteria($data['evaluationCriteria']);

        // Update language if provided
        if (isset($data['language_id'])) {
            $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
            if ($language) {
                $task->setLanguage($language);
            }
        }

        $this->em->flush();

        return $this->json([
            'id' => $task->getId(),
            'message' => 'Task updated successfully!',
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $task = $this->taskRepository->find($id);
    
        if (!$task) {
            return $this->json(['error' => 'Task not found'], 404);
        }
    
        // Remove all related prog_problem_task entries before deleting the task
        $progProblemTaskRepository = $this->em->getRepository(ProgProblemTask::class);
        $linkedProgProblemTasks = $progProblemTaskRepository->findBy(['task' => $task]);
    
        foreach ($linkedProgProblemTasks as $progProblemTask) {
            $this->em->remove($progProblemTask);
        }
    
        $this->em->remove($task);
        $this->em->flush();
    
        return $this->json(['message' => 'Task deleted successfully!']);
    }
} 
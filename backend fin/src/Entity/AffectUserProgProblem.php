<?php

namespace App\Entity;

use App\Repository\AffectUserProgProblemRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * AffectUserProgProblem Entity
 * 
 * Junction entity that connects users with programming problems.
 * Represents the assignment of programming problems to users.
 * This is equivalent to the AffectUserQuiz entity in the Quiz system.
 */
#[ORM\Entity(repositoryClass: AffectUserProgProblemRepository::class)]
class AffectUserProgProblem
{
    /**
     * Primary key identifier
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * The user the programming problem is assigned to
     * Many programming problems can be assigned to one user
     */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    /**
     * The programming problem assigned to the user
     * One programming problem can be assigned to many users
     */
    #[ORM\ManyToOne(targetEntity: ProgProblem::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?ProgProblem $progProblem = null;

    /**
     * Timestamp when this assignment was created
     */
    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $dateAffectation;

    /**
     * Counter for number of times this problem was attempted/started
     */
    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $nombrePassed = 0;

    /**
     * Current status of the assignment
     * Values: 'pending', 'in progress', 'completed'
     */
    #[ORM\Column(type: 'string', length: 20, options: ['default' => 'pending'])]
    private string $status = 'pending'; 

    /**
     * Constructor - initializes assignment date to current timestamp
     */
    public function __construct()
    {
        $this->dateAffectation = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getProgProblem(): ?ProgProblem
    {
        return $this->progProblem;
    }

    public function setProgProblem(?ProgProblem $progProblem): static
    {
        $this->progProblem = $progProblem;
        return $this;
    }

    public function getDateAffectation(): \DateTimeInterface
    {
        return $this->dateAffectation;
    }

    public function setDateAffectation(\DateTimeInterface $dateAffectation): static
    {
        $this->dateAffectation = $dateAffectation;
        return $this;
    }

    public function getNombrePassed(): int
    {
        return $this->nombrePassed;
    }

    public function setNombrePassed(int $nombrePassed): static
    {
        $this->nombrePassed = $nombrePassed;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }
} 